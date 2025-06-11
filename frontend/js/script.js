// Elementos do login
const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");
const fileInput = login.querySelector("input[type='file']");

// Elementos do chat
const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");

// Cores disponíveis para os usuários
const colors = [
  "cadetblue",
  "darkgoldenrod",
  "cornflowerblue",
  "darkkhaki",
  "hotpink",
  "gold",
];

// Usuário atual
const user = {
  id: "",
  name: "",
  color: "",
  avatar: null,
};

let websocket;

// Cria elemento mensagem própria com avatar
const createMessageSelfElement = (content, avatar) => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message--self");

  const contentBox = document.createElement("div");
  contentBox.classList.add("message__content");
  contentBox.style.backgroundColor = user.color;

  // Define a cor do texto baseado no contraste com o background
  contentBox.style.color = getContrastColor(user.color);

  const messageText = document.createElement("div");
  messageText.classList.add("message__bubble");
  messageText.textContent = content;

  contentBox.appendChild(messageText);

  const avatarImg = document.createElement("img");
  avatarImg.src = avatar || "default-avatar.png";
  avatarImg.alt = "Avatar";
  avatarImg.classList.add("message__avatar");
  avatarImg.style.borderColor = user.color;

  wrapper.appendChild(contentBox);
  wrapper.appendChild(avatarImg);

  return wrapper;
};

// Cria elemento mensagem de outros com avatar
const createMessageOtherElement = (content, sender, senderColor, avatar) => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message--other");

  const avatarImg = document.createElement("img");
  avatarImg.src = avatar || "default-avatar.png";
  avatarImg.alt = "Avatar";
  avatarImg.classList.add("message__avatar");
  avatarImg.style.borderColor = senderColor;

  const contentBox = document.createElement("div");
  contentBox.classList.add("message__content");
  contentBox.style.backgroundColor = senderColor;

  // Define a cor do texto com base na cor do background
  contentBox.style.color = getContrastColor(senderColor);

  const senderName = document.createElement("span");
  senderName.classList.add("message--sender");
  senderName.style.color = getContrastColor(senderColor);
  senderName.textContent = sender;

  const messageText = document.createElement("div");
  messageText.classList.add("message__bubble");
  messageText.textContent = content;

  contentBox.appendChild(senderName);
  contentBox.appendChild(messageText);

  wrapper.appendChild(avatarImg);
  wrapper.appendChild(contentBox);

  return wrapper;
};

// Cor aleatória
const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

const scrollScreen = () => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Processa mensagem recebida
const processMessage = ({ data }) => {
  try {
    const { userId, userName, userColor, content, avatar } = JSON.parse(data);

    const message =
      userId === user.id
        ? createMessageSelfElement(content, avatar || user.avatar)
        : createMessageOtherElement(content, userName, userColor, avatar);

    chatMessages.appendChild(message);
    scrollScreen();
  } catch (err) {
    console.error("Erro ao processar mensagem:", err);
  }
};

// Inicia chat após login com avatar carregado
function startChat(name, avatar) {
  user.id = crypto.randomUUID();
  user.name = name;
  user.color = getRandomColor();
  user.avatar = avatar;

  login.style.display = "none";
  chat.style.display = "flex";

  websocket = new WebSocket("ws://localhost:8080");
  websocket.onmessage = processMessage;

  websocket.onopen = () => {
    console.log("WebSocket conectado");
  };
  websocket.onerror = (error) => {
    console.error("WebSocket erro:", error);
  };
  websocket.onclose = () => {
    console.log("WebSocket desconectado");
  };
}

// Evento submit do login com upload de imagem
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = loginInput.value.trim();
  if (!name) {
    alert("Por favor, insira seu nome");
    return;
  }

  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const avatarBase64 = reader.result;
      startChat(name, avatarBase64);
    };
    reader.onerror = () => {
      alert("Erro ao carregar a imagem");
      startChat(name, null);
    };
    reader.readAsDataURL(file);
  } else {
    startChat(name, null);
  }
});

// Envia mensagem via WebSocket
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    alert("WebSocket não está conectado.");
    return;
  }

  const messageContent = chatInput.value.trim();
  if (!messageContent) return;

  const message = {
    userId: user.id,
    userName: user.name,
    userColor: user.color,
    content: messageContent,
    avatar: user.avatar,
  };

  websocket.send(JSON.stringify(message));
  chatInput.value = "";
});

const avatarPreview = document.getElementById("avatarPreview");

avatarPreview.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.src = e.target.result;
      user.avatar = e.target.result; // salvar no objeto user para enviar
    };
    reader.readAsDataURL(file);
  }
});

function getContrastColor(hexColor) {
  // Remove o # caso exista
  const color = hexColor.replace("#", "");

  // Converte hex para RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calcula luminosidade relativa (fórmula padrão)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Se a cor for escura, texto branco, se clara, texto preto
  return luminance > 0.5 ? "#121212" : "#f2f2f2";
}
