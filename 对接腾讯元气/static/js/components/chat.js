/**
 * scroll to the bottom of the chats after new message has been added to chat
 */
const converter = new showdown.Converter();
let chatHistory = []; // 用于存储聊天记录

function scrollToBottomOfResults() {
  const terminalResultsDiv = document.getElementById("chats");
  terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
}

/**
 * Set user response on the chat screen
 * @param {String} message user message
 */
function setUserResponse(message) {
  const user_response = `<img class="userAvatar" src='./static/img/userAvatar.jpg'><p class="userMsg">${message}</p><div class="clearfix"></div>`;
  $(user_response).appendTo(".chats").show("slow");

  $(".usrInput").val("");
  scrollToBottomOfResults();
  showBotTyping();
  $(".suggestions").remove();
}

/**
 * returns formatted bot response
 * @param {String} text bot message response's text
 *
 */
function getBotResponse(text) {
  // 将 Markdown 文本转换为 HTML
  const formattedText = converter.makeHtml(text);
  botResponse = `<img class="botAvatar" src="./static/img/sara_avatar.png"/><span class="botMsg">${formattedText}</span><div class="clearfix"></div>`;
  return botResponse;
}

/**
 * 让 botMsg 内的链接在新标签页打开
 */
function makeBotLinksOpenInNewTab() {
  $(".botMsg a").attr("target", "_blank");
}

/**
 * renders bot response on to the chat screen
 * @param {Array} response json array containing different types of bot response
 *
 * for more info: `https://rasa.com/docs/rasa/connectors/your-own-website#request-and-response-format`
 */
function setBotResponse(response) {
  // renders bot response after 500 milliseconds
  setTimeout(() => {
    hideBotTyping();
    if (response.length < 1) {
      // if there is no response from Rasa, send  fallback message to the user
      const fallbackMsg = "我没有成功的与智能体连接，请联系管理员处理";
      const formattedFallbackMsg = converter.makeHtml(fallbackMsg);

      const BotResponse = `<img class="botAvatar" src="./static/img/sara_avatar.png"/><p class="botMsg">${formattedFallbackMsg}</p><div class="clearfix"></div>`;

      $(BotResponse).appendTo(".chats").hide().fadeIn(1000);
      scrollToBottomOfResults();
    } else {
      // 假设腾讯元气 API 返回的文本在 response.choices[0].message.content 中
      const text = response.choices[0].message.content;
      const botResponse = getBotResponse(text);
      $(botResponse).appendTo(".chats").hide().fadeIn(1000);
      scrollToBottomOfResults();
      // 将机器人的回复添加到聊天记录中
      chatHistory.push({
        role: "assistant",
        content: [
          {
            type: "text",
            text: text
          }
        ]
      });
    }
    makeBotLinksOpenInNewTab(); // 调用函数让链接在新标签页打开
    $(".usrInput").focus();
  }, 500);
}

/**
 * sends the user message to the 腾讯元气 API server,
 * @param {String} message user message
 */
async function send(message) {
  await new Promise((r) => setTimeout(r, 2000));
  // 将用户的新消息添加到聊天记录中
  chatHistory.push({
    role: "user",
    content: [
      {
        type: "text",
        text: message
      }
    ]
  });

  $.ajax({
    url: yuanqi_api_url,
    type: "POST",
    contentType: "application/json",
    headers: {
      'X-Source': 'openapi',
      'Authorization': authorization_token
    },
    data: JSON.stringify({
      "assistant_id": assistant_id,
      "user_id": user_id,
      "stream": false,
      "messages": chatHistory
    }),
    success(botResponse, status) {
      console.log("Response from 腾讯元气 API: ", botResponse, "\nStatus: ", status);
      setBotResponse(botResponse);
    },
    error(xhr, textStatus) {
      // if there is no response from 腾讯元气 API server, set error bot response
      setBotResponse("");
      console.log("Error from bot end: ", textStatus);
    }
  });
}

/**
 * clears the conversation from the chat screen
 * & sends the `/resart` event to the 腾讯元气 API server
 */
function restartConversation() {
  $("#userInput").prop("disabled", true);
  // destroy the existing chart
  $(".collapsible").remove();

  if (typeof chatChart !== "undefined") {
    chatChart.destroy();
  }

  $(".chart-container").remove();
  if (typeof modalChart !== "undefined") {
    modalChart.destroy();
  }
  $(".chats").html("");
  $(".usrInput").val("");
  // 清空聊天记录
  chatHistory = [];
  // 这里因为是重新开始对话，可能不需要发送特定指令给腾讯元气 API，可根据实际情况调整
  // send("/restart");
  $("#userInput").prop("disabled", false);
}
// triggers restartConversation function.
$("#restart").click(() => {
  restartConversation();
});

/**
 * if user hits enter or send button
 * */
$(".usrInput").on("keyup keypress", (e) => {
  const keyCode = e.keyCode || e.which;

  const text = $(".usrInput").val();
  if (keyCode === 13) {
    if (text === "" || $.trim(text) === "") {
      e.preventDefault();
      return false;
    }
    // destroy the existing chart, if yu are not using charts, then comment the below lines
    $(".collapsible").remove();
    $(".dropDownMsg").remove();
    if (typeof chatChart !== "undefined") {
      chatChart.destroy();
    }

    $(".chart-container").remove();
    if (typeof modalChart !== "undefined") {
      modalChart.destroy();
    }

    $("#paginated_cards").remove();
    $(".suggestions").remove();
    $(".quickReplies").remove();
    $(".usrInput").blur();
    setUserResponse(text);
    send(text);
    e.preventDefault();
    return false;
  }
  return true;
});

$("#sendButton").on("click", (e) => {
  const text = $(".usrInput").val();
  if (text === "" || $.trim(text) === "") {
    e.preventDefault();
    return false;
  }
  // destroy the existing chart, if yu are not using charts, then comment the below lines
  $(".collapsible").remove();
  $(".dropDownMsg").remove();
  if (typeof chatChart !== "undefined") {
    chatChart.destroy();
  }

  $(".chart-container").remove();
  if (typeof modalChart !== "undefined") {
    modalChart.destroy();
  }

  $("#paginated_cards").remove();
  $(".suggestions").remove();
  $(".quickReplies").remove();
  $(".usrInput").blur();
  setUserResponse(text);
  send(text);
  e.preventDefault();
  return false;
});