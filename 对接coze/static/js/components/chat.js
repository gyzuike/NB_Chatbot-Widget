const converter = new showdown.Converter();
let chatHistory = [];
let currentConversationId = null;

function scrollToBottomOfResults() {
  const terminalResultsDiv = document.getElementById("chats");
  terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
}

function setUserResponse(message) {
  const user_response = `<img class="userAvatar" src='./static/img/userAvatar.jpg'><p class="userMsg">${message}</p><div class="clearfix"></div>`;
  $(user_response).appendTo(".chats").show("slow");
  $(".usrInput").val("");
  scrollToBottomOfResults();
  showBotTyping();
  $(".suggestions").remove();
}

function getBotResponse(text) {
  const formattedText = converter.makeHtml(text);
  return `<img class="botAvatar" src="./static/img/sara_avatar.png"/><span class="botMsg">${formattedText}</span><div class="clearfix"></div>`;
}

function makeBotLinksOpenInNewTab() {
  $(".botMsg a").attr("target", "_blank");
}

function setBotResponse(response) {
  setTimeout(() => {
    hideBotTyping();

    if (!response || !response.data || !response.data.messages || response.data.messages.length === 0) {
      const fallbackMsg = "请求失败，请检查网络或联系管理员";
      const BotResponse = `<img class="botAvatar" src="./static/img/sara_avatar.png"/><p class="botMsg">${fallbackMsg}</p><div class="clearfix"></div>`;
      $(BotResponse).appendTo(".chats").hide().fadeIn(1000);
      scrollToBottomOfResults();
      return;
    }

    currentConversationId = response.data.conversation_id || currentConversationId;

    response.data.messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.content) {
        const botResponse = getBotResponse(msg.content);
        $(botResponse).appendTo(".chats").hide().fadeIn(1000);
        
        chatHistory.push({
          role: "assistant",
          content: msg.content,
          content_type: msg.content_type || "text"
        });
      }
    });

    scrollToBottomOfResults();
    makeBotLinksOpenInNewTab();
    $(".usrInput").focus();
  }, 500);
}

async function send(message) {
  chatHistory.push({
    role: "user",
    content: message,
    content_type: "text"
  });

  const requestData = {
    bot_id: assistant_id,
    user_id: user_id,
    stream: false,
    auto_save_history: true,
    messages: [{
      role: "user",
      content: message,
      content_type: "text"
    }]
  };

  if (currentConversationId) {
    requestData.conversation_id = currentConversationId;
  }

  try {
    const response = await fetch(coze_api_url, {
      method: "POST",
      headers: {
        'Authorization': authorization_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    console.log("API Response:", data);
    
    if (!response.ok) {
      throw new Error(data.msg || '请求失败');
    }
    
    setBotResponse(data);
  } catch (error) {
    console.error("Error:", error);
    setBotResponse({});
  }
}

function restartConversation() {
  $("#userInput").prop("disabled", true);
  $(".chats").html("");
  $(".usrInput").val("");
  chatHistory = [];
  currentConversationId = null;
  $("#userInput").prop("disabled", false);
  $(".collapsible, .chart-container").remove();
}

$("#restart").click(restartConversation);

$(".usrInput").on("keyup keypress", (e) => {
  if (e.keyCode === 13) {
    const text = $(".usrInput").val().trim();
    if (text) {
      $(".collapsible").remove();
      setUserResponse(text);
      send(text);
      e.preventDefault();
    }
  }
});

$("#sendButton").on("click", () => {
  const text = $(".usrInput").val().trim();
  if (text) {
    $(".collapsible").remove();
    setUserResponse(text);
    send(text);
  }
});

function showBotTyping() {
  const botTyping = `<div class="botTyping"><img class="botAvatar" src="./static/img/sara_avatar.png"/><span class="botMsg"><span class="typing-dots">.</span><span class="typing-dots">.</span><span class="typing-dots">.</span></span></div>`;
  $(botTyping).appendTo(".chats");
  scrollToBottomOfResults();
}

function hideBotTyping() {
  $(".botTyping").remove();
}