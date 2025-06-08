/**
 * MCP Feedback Collector - Frontend Application Script
 */

// Global variables
let socket = null;
let currentTab = 'report';
let selectedImages = [];
let chatImages = [];
let isConnected = false;
let currentFeedbackSession = null;

// AI chat related variables
let chatConfig = null;
let chatHistory = [];
let currentAIMessage = null;
let currentAIContent = '';
let isApiCalling = false;

// Auto-refresh related variables
let autoRefreshInterval = null;
let autoRefreshCountdown = 10;  // Changed to 10 seconds
let autoRefreshTimer = null;
let lastWorkSummary = null;  // Record the last work report content

// Get API configuration
async function loadChatConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            chatConfig = await response.json();
            console.log('Chat configuration loaded successfully:', chatConfig);

            // Check if API hint needs to be displayed
            if (!chatConfig.api_key) {
                const apiHint = document.getElementById('api-hint');
                if (apiHint) {
                    apiHint.style.display = 'block';
                }
            }

            return true;
        } else {
            console.error('Failed to get configuration:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        return false;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Load chat configuration
    loadChatConfig();

    // Get and display version information
    fetchVersionInfo();

    initializeSocket();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const session = urlParams.get('session');

    console.log('URL parameters:', { mode, session });

    if (mode === 'feedback' && session) {
        // Traditional feedback mode, set session ID and get work report
        currentFeedbackSession = session;
        console.log('Traditional mode - Setting feedback session ID:', session);

        // Wait for WebSocket connection to establish before getting work report
        setTimeout(() => {
            if (isConnected && socket) {
                console.log('Requesting work report data...');
                socket.emit('get_work_summary', { feedback_session_id: session });
            } else {
                console.log('WebSocket not connected, retrying later...');
                setTimeout(() => {
                    if (isConnected && socket) {
                        socket.emit('get_work_summary', { feedback_session_id: session });
                    }
                }, 1000);
            }
        }, 500);

        // Show feedback tab
        showTab('feedback');
    } else {
        // Fixed URL mode or default mode
        console.log('Fixed URL mode - Waiting for session assignment');

        // Wait for WebSocket connection to establish before requesting session assignment
        setTimeout(() => {
            if (isConnected && socket) {
                console.log('Requesting session assignment...');
                socket.emit('request_session');
            } else {
                console.log('WebSocket not connected, retrying later...');
                setTimeout(() => {
                    if (isConnected && socket) {
                        socket.emit('request_session');
                    }
                }, 1000);
            }
        }, 500);

        // Default display work report tab (because it's active by default in HTML)
        showTab('feedback');
    }

    // Start auto-refresh by default
    setTimeout(() => {
        startAutoRefresh();
    }, 1000); // Delay 1 second to start, ensuring page is fully loaded
});

// Initialize WebSocket connection
function initializeSocket() {
    console.log('Initializing Socket.IO connection...');

    socket = io({
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', function() {
        isConnected = true;
        updateConnectionStatus('connected', 'Connected');
        console.log('WebSocket connection successful, ID:', socket.id);
    });

    socket.on('disconnect', function(reason) {
        isConnected = false;
        updateConnectionStatus('disconnected', 'Disconnected');
        console.log('WebSocket connection closed, reason:', reason);
    });

    socket.on('connect_error', function(error) {
        isConnected = false;
        updateConnectionStatus('disconnected', 'Connection Failed');
        console.error('WebSocket connection error:', error);
        showStatusMessage('error', 'Failed to connect to server, please check your network or refresh the page');
    });

    socket.on('feedback_session_started', function(data) {
        console.log('Feedback session started:', data);
    });

    socket.on('feedback_submitted', function(data) {
        clearFeedbackForm();

        // Re-enable submit button
        const submitBtn = document.getElementById('submit-feedback-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Feedback';

        // Clear all previous status messages (including "Latest work report retrieved" notification)
        clearAllStatusMessages();

        // Show persistent success message (don't auto-close window)
        showStatusMessage('success', '✅ Feedback submitted successfully! Thank you for your valuable input. The window will remain open for your continued use.');

        console.log('Feedback submitted successfully, window remains open');
    });

    socket.on('feedback_error', function(data) {
        showStatusMessage('error', data.error);
    });

    socket.on('work_summary_data', function(data) {
        console.log('Received work report data:', data);
        if (data.work_summary) {
            displayWorkSummary(data.work_summary);
            // Record initial work report content
            lastWorkSummary = data.work_summary;
            // Switch to feedback tab
            showTab('feedback');
        }
    });

    // Handle session assignment response
    socket.on('session_assigned', function(data) {
        console.log('Received session assignment:', data);
        if (data.session_id) {
            currentFeedbackSession = data.session_id;
            console.log('Fixed URL mode - Assigned session ID:', data.session_id);

            // If there's a work report, display it
            if (data.work_summary) {
                // Check if it's new content (if page already has content)
                const hasExistingContent = lastWorkSummary && lastWorkSummary !== data.work_summary;

                displayWorkSummary(data.work_summary);

                // If it's new content and page already has content, auto-refresh page
                if (hasExistingContent) {
                    console.log('Detected new work report content, page will auto-refresh in 3 seconds to reset session');
                    showRefreshStatus('success', '✅ New work report detected, page will auto-refresh');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    // Record initial work report content
                    lastWorkSummary = data.work_summary;
                    showTab('feedback');
                }
            }
        }
    });

    // Handle case when no active session
    socket.on('no_active_session', function(data) {
        console.log('No active session:', data);
        // Stay on chat tab, user can use AI conversation functionality normally
    });

    // Handle latest work report response
    socket.on('latest_summary_response', function(data) {
        console.log('Received latest work report response:', data);

        if (data.success && data.work_summary) {
            // Check if content is different from last time
            if (lastWorkSummary !== data.work_summary) {
                // Display latest work report
                displayWorkSummary(data.work_summary);
                // Update recorded content
                lastWorkSummary = data.work_summary;
                // Restore button text
                const refreshText = document.getElementById('refresh-text');
                if (refreshText) {
                    refreshText.textContent = 'Refresh Latest Report';
                }
                // Use text status display instead of popup notification
                showRefreshStatus('success', '✅ Latest work report retrieved, page will auto-refresh');

                // Auto-refresh page after getting new content to solve session expiration issue
                console.log('Detected new work report content, page will auto-refresh in 3 seconds to reset session');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                // Content is the same, show no change status
                showRefreshStatus('success', 'No content changes');
                console.log('Work report content unchanged, skipping notification');
            }
        } else {
            // No latest work report found
            showRefreshStatus('error', data.message || 'No latest work report available');
        }
    });
}

// Update connection status
function updateConnectionStatus(status, text) {
    const statusEl = document.getElementById('connection-status');
    statusEl.className = `connection-status ${status}`;
    statusEl.textContent = text;
}

// Show status message
function showStatusMessage(type, message, autoRemove = true) {
    const container = document.getElementById('status-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.textContent = message;

    container.appendChild(messageEl);

    // Decide auto-remove time based on type and parameters
    if (autoRemove) {
        let removeTime = 3000; // Default 3 seconds
        if (type === 'success') {
            removeTime = 2000; // Success messages removed after 2 seconds
        }

        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, removeTime);
    }

    // Return message element so external code can update content
    return messageEl;
}

// Clear all status messages
function clearAllStatusMessages() {
    const container = document.getElementById('status-messages');
    if (container) {
        container.innerHTML = '';
    }
}

// Show specified tab
function showTab(tabName) {
    currentTab = tabName;

    // Update tab status
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Find corresponding tab button and activate
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        if ((tabName === 'feedback' && tab.textContent.includes('Work Report')) ||
            (tabName === 'chat' && tab.textContent.includes('AI Conversation'))) {
            tab.classList.add('active');
        }
    });

    // Update content area display
    document.querySelectorAll('.content-area').forEach(area => {
        area.classList.remove('active');
    });

    // Show corresponding content based on tab name
    const contentId = tabName === 'feedback' ? 'report-content' : 'chat-content';
    const contentElement = document.getElementById(contentId);
    if (contentElement) {
        contentElement.classList.add('active');
    }
}

// Switch tab (maintain backward compatibility)
function switchTab(tabName) {
    // Map tab names
    const tabMapping = {
        'report': 'feedback',
        'feedback': 'feedback',
        'chat': 'chat'
    };

    const newTabName = tabMapping[tabName] || tabName;
    showTab(newTabName);
}

// Feedback form related functions
function selectImages() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addImage(file);
            }
        });
    };

    input.click();
}

function pasteImages() {
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    item.getType(type).then(blob => {
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                        addImage(file);
                    });
                }
            }
        }
    }).catch(err => {
        console.log('Paste failed:', err);
        showStatusMessage('error', 'Failed to paste image, please try selecting files instead');
    });
}

function addImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = {
            file: file,
            data: e.target.result,
            name: file.name,
            size: file.size,
            type: file.type,
            id: Date.now() + Math.random()
        };

        selectedImages.push(imageData);
        updateImagePreviews();
    };
    reader.readAsDataURL(file);
}

function updateImagePreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = '';

    selectedImages.forEach((image, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        previewDiv.innerHTML = `
            <img src="${image.data}" alt="${image.name}" class="preview-img">
            <button type="button" class="remove-btn" onclick="removeImage(${index})">×</button>
        `;
        container.appendChild(previewDiv);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreviews();
}

function clearFeedbackForm() {
    document.getElementById('feedback-text').value = '';
    selectedImages = [];
    updateImagePreviews();
}

// Quick phrase content
const QUICK_PHRASE = `

---

Whenever you want to ask a question, always call the MCP .

Whenever you're about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user's feedback is empty, then end the request. mcp-interactive-feedback.interactive-feedback`;

// Submit feedback
document.getElementById('feedback-form').addEventListener('submit', function(e) {
    e.preventDefault();

    let feedbackText = document.getElementById('feedback-text').value.trim();

    // Check if quick phrase should be appended
    const addQuickPhrase = document.getElementById('add-quick-phrase').checked;
    if (addQuickPhrase && feedbackText) {
        feedbackText += QUICK_PHRASE;
    }

    console.log('Submitting feedback:', {
        text: feedbackText,
        images: selectedImages.length,
        session: currentFeedbackSession,
        connected: isConnected
    });

    if (!feedbackText && selectedImages.length === 0) {
        showStatusMessage('error', 'Please enter feedback content or select images');
        return;
    }

    if (!isConnected) {
        showStatusMessage('error', 'Connection lost, please refresh the page and try again');
        return;
    }

    // Check session ID
    if (!currentFeedbackSession) {
        showStatusMessage('error', 'Currently in demo mode, please create an official feedback session through MCP tool function call');
        console.log('Demo mode - Feedback content:', {
            text: feedbackText,
            images: selectedImages.length,
            timestamp: new Date().toLocaleString()
        });

        // Show demo feedback
        showStatusMessage('info', 'Demo feedback has been logged to console, please check browser developer tools');
        clearFeedbackForm();
        return;
    }

    // Disable submit button
    const submitBtn = document.getElementById('submit-feedback-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

    // Send feedback data
    const feedbackData = {
        text: feedbackText,
        images: selectedImages.map(img => ({
            name: img.name,
            data: img.data,
            size: img.size,
            type: img.type
        })),
        timestamp: Date.now(),
        sessionId: currentFeedbackSession
    };

    console.log('Sending feedback data:', feedbackData);
    socket.emit('submit_feedback', feedbackData);
});

// Show work report content
function displayWorkSummary(workSummary) {
    console.log('displayWorkSummary called:', workSummary);

    if (!workSummary || workSummary.trim() === '') {
        console.log('Work report content is empty');
        return;
    }

    // Find work report content area
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
        console.error('report-content element not found');
        return;
    }

    // Hide default message
    const defaultMessage = document.getElementById('default-message');
    if (defaultMessage) {
        defaultMessage.style.display = 'none';
    }

    // Check if AI work report card already exists
    const existingCard = reportContent.querySelector('.ai-work-report');
    if (existingCard) {
        existingCard.remove();
    }

    // Create AI work report card
    const aiReportCard = document.createElement('div');
    aiReportCard.className = 'report-card ai-work-report';
    aiReportCard.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <span>🤖</span>
                AI Work Report
            </div>
            <div class="card-subtitle">Just completed</div>
        </div>
        <div class="card-body">
            <div class="work-summary-content">${workSummary.replace(/\n/g, '<br>')}</div>
        </div>
    `;

    // Insert before existing content
    const firstCard = reportContent.querySelector('.report-card');
    if (firstCard) {
        reportContent.insertBefore(aiReportCard, firstCard);
    } else {
        reportContent.appendChild(aiReportCard);
    }

    console.log('AI work report card added');

    // Add styles (only once)
    if (!document.querySelector('#work-summary-styles')) {
        const style = document.createElement('style');
        style.id = 'work-summary-styles';
        style.textContent = `
            .work-summary-content {
                color: #cccccc;
                line-height: 1.6;
                font-size: 13px;
                white-space: pre-wrap;
                word-wrap: break-word;
                background: #1e1e1e;
                padding: 12px;
                border-radius: 4px;
                border: 1px solid #3e3e42;
            }
            .ai-work-report {
                border-left: 3px solid #4ec9b0;
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== Work report refresh functionality ====================

/**
 * Show refresh status
 */
function showRefreshStatus(type, message) {
    const statusText = document.getElementById('refresh-status-text');
    if (!statusText) return;

    statusText.className = `refresh-status-text ${type}`;
    statusText.textContent = message;

    // If it's success or error status, clear after 2 seconds
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusText.textContent = '';
            statusText.className = 'refresh-status-text';
        }, 2000);
    }
}

/**
 * Hide refresh status
 */
function hideRefreshStatus() {
    const statusText = document.getElementById('refresh-status-text');
    if (statusText) {
        statusText.textContent = '';
        statusText.className = 'refresh-status-text';
    }
}

/**
 * Manual refresh work report
 */
function refreshWorkSummary() {
    console.log('Manual refresh work report');

    const refreshBtn = document.getElementById('refresh-report-btn');
    const refreshText = document.getElementById('refresh-text');

    if (!refreshBtn || !refreshText) {
        console.error('Refresh button element not found');
        return;
    }

    if (isConnected && socket) {
        // Show loading status
        refreshText.textContent = 'Getting latest work report...';
        showRefreshStatus('loading', 'Getting latest work report...');

        // Request latest work report
        socket.emit('request_latest_summary');

        // 5 seconds later restore button text (prevent blocking)
        setTimeout(() => {
            refreshText.textContent = 'Refresh Latest Report';
            hideRefreshStatus();
        }, 5000);
    } else {
        // Handle disconnection
        showRefreshStatus('error', 'Disconnected, cannot refresh');
    }
}

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
    console.log('Starting auto-refresh');

    // Clear existing timer
    stopAutoRefresh();

    // Reset countdown
    autoRefreshCountdown = 10;
    updateAutoRefreshCountdown();

    // Set countdown timer
    autoRefreshTimer = setInterval(() => {
        autoRefreshCountdown--;
        updateAutoRefreshCountdown();

        if (autoRefreshCountdown <= 0) {
            // Execute refresh
            refreshWorkSummary();
            // Reset countdown
            autoRefreshCountdown = 10;
        }
    }, 1000);

    console.log('Auto-refresh enabled, refreshing every 10 seconds');
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }

    autoRefreshCountdown = 10;
    updateAutoRefreshCountdown();

    console.log('Auto-refresh stopped');
}

/**
 * Update auto-refresh countdown display
 */
function updateAutoRefreshCountdown() {
    const countdownEl = document.getElementById('auto-refresh-countdown');
    const statusText = document.getElementById('refresh-status-text');

    if (countdownEl) {
        countdownEl.textContent = autoRefreshCountdown;
    }

    if (statusText) {
        statusText.textContent = `Next auto-refresh: ${autoRefreshCountdown} seconds later`;
        statusText.className = 'refresh-status-text';
    }
}

// ==================== AI chat functionality ====================

// Chat related functions
function selectChatImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addChatImage(file);
            }
        });
    };

    input.click();
}

function pasteChatImage() {
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    item.getType(type).then(blob => {
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                        addChatImage(file);
                    });
                }
            }
        }
    }).catch(err => {
        console.log('Paste failed:', err);
        showStatusMessage('error', 'Failed to paste image, please try selecting files instead');
    });
}

function addChatImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = {
            file: file,
            data: e.target.result,
            name: file.name,
            id: Date.now() + Math.random()
        };
        chatImages.push(imageData);
        updateChatImagePreviews();
        showStatusMessage('info', `Image added: ${file.name}`);
    };
    reader.readAsDataURL(file);
}

function updateChatImagePreviews() {
    const container = document.getElementById('chat-image-previews-content');
    const previewArea = document.getElementById('chat-image-previews');

    if (!container || !previewArea) return;

    container.innerHTML = '';

    if (chatImages.length === 0) {
        previewArea.style.display = 'none';
        return;
    }

    previewArea.style.display = 'block';

    chatImages.forEach((image, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        previewDiv.innerHTML = `
            <img src="${image.data}" alt="${image.name}" class="preview-img">
            <button type="button" class="remove-btn" onclick="removeChatImage(${index})">×</button>
        `;
        container.appendChild(previewDiv);
    });
}

function removeChatImage(index) {
    chatImages.splice(index, 1);
    updateChatImagePreviews();
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const messageText = input ? input.value.trim() : '';

    if (!messageText && chatImages.length === 0) {
        return;
    }

    // Check configuration
    if (!chatConfig || !chatConfig.api_key) {
        showStatusMessage('error', 'API configuration not loaded or API key not set');
        return;
    }

    if (isApiCalling) {
        showStatusMessage('warning', 'Processing, please wait...');
        return;
    }

    // Add user message to interface
    addMessageToChat('user', messageText, chatImages);

    // Clear input
    if (input) input.value = '';
    const currentImages = chatImages.slice();
    chatImages = [];
    updateChatImagePreviews();

    // Disable send button
    const sendBtn = document.getElementById('send-chat-btn');
    sendBtn.disabled = true;
    isApiCalling = true;

    // Prepare to receive AI reply
    currentAIContent = '';
    currentAIMessage = addMessageToChat('ai', '', []);

    try {
        await callChatAPI(messageText, currentImages);
    } catch (error) {
        console.error('Chat API call failed:', error);
        showStatusMessage('error', `Chat failed: ${error.message}`);
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        isApiCalling = false;
    }
}

// Directly call chat API
async function callChatAPI(messageText, images) {
    // Build message format
    const userMessage = buildAPIMessage(messageText, images);

    // Add to chat history
    chatHistory.push(userMessage);

    // Build API request
    const requestBody = {
        model: chatConfig.model,
        messages: chatHistory,
        stream: true,
        temperature: chatConfig.temperature || 0.7,
        max_tokens: chatConfig.max_tokens || 2000
    };

    console.log('Sending API request:', {
        url: `${chatConfig.api_base_url}/v1/chat/completions`,
        model: requestBody.model,
        messageCount: requestBody.messages.length
    });

    const response = await fetch(`${chatConfig.api_base_url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${chatConfig.api_key}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle stream response
    await handleStreamResponse(response);
}

// Build API message format
function buildAPIMessage(messageText, images) {
    if (!images || images.length === 0) {
        // Pure text message
        return { role: "user", content: messageText };
    } else {
        // Message with images
        const content = [];

        if (messageText) {
            content.push({ type: "text", text: messageText });
        }

        images.forEach(img => {
            let imageData = img.data;
            // Ensure it's complete data URL format
            if (!imageData.startsWith('data:image/')) {
                imageData = `data:image/png;base64,${imageData}`;
            }

            content.push({
                type: "image_url",
                image_url: { url: imageData }
            });
        });

        return { role: "user", content: content };
    }
}

// Handle stream response
async function handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponseContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '') continue;

                if (line.startsWith('data: ')) {
                    const data = line.slice(6); // Remove 'data: ' prefix

                    if (data === '[DONE]') {
                        // Stream response ended
                        if (aiResponseContent) {
                            // Add AI reply to chat history
                            chatHistory.push({
                                role: "assistant",
                                content: aiResponseContent
                            });
                        }
                        console.log('AI reply completed, total length:', aiResponseContent.length);
                        return;
                    }

                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData.choices && jsonData.choices[0]) {
                            const delta = jsonData.choices[0].delta;
                            if (delta && delta.content) {
                                aiResponseContent += delta.content;

                                // Update interface display
                                if (currentAIMessage) {
                                    currentAIMessage.innerHTML = aiResponseContent;

                                    // Scroll to bottom
                                    const chatMessages = document.getElementById('chat-messages');
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore JSON parsing error
                        console.log('JSON parsing error:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error handling stream response:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}

function addMessageToChat(sender, text, images) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    let imageHtml = '';
    if (images && images.length > 0) {
        imageHtml = images.map(img =>
            `<img src="${img.data}" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin: 4px 0; display: block;">`
        ).join('');
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = `${imageHtml}${text}`;

    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return bubbleDiv; // Return bubble element for updating AI message
}

function clearChat() {
    if (confirm('Are you sure you want to clear all chat history?')) {
        // Clear chat history
        chatHistory = [];

        // Clear interface display
        clearChatMessages();

        showStatusMessage('info', 'Chat history cleared');
    }
}

function clearChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    // Keep welcome message and API hint
    const children = Array.from(chatMessages.children);
    children.forEach((child, index) => {
        if (index > 2) { // Keep first 3 elements (time, welcome message, API hint)
            child.remove();
        }
    });
}

// Get version information
async function fetchVersionInfo() {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const data = await response.json();
            updateVersionDisplay(data.version);
        } else {
            console.log('Failed to get version information, using default version');
        }
    } catch (error) {
        console.log('Failed to get version information:', error);
    }
}

// Update version display
function updateVersionDisplay(version) {
    const versionElement = document.getElementById('version-number');
    if (versionElement && version) {
        versionElement.textContent = version;
    }
}
