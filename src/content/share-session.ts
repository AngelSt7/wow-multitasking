import Swal from "sweetalert2";
import { RedisService } from "../redis/RedisService";
import { Logger } from "../log/logger";

const CODE_REGEX = /^\d{6}$/;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidCode(code: string): boolean {
  return CODE_REGEX.test(code);
}


chrome.runtime.onMessage.addListener(
  async (message, _, sendResponse) => {
    if (message.type !== "SHARE_SESSION") {
      return;
    }

    try {
      const session: Record<string, string> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key) continue;

        session[key] = localStorage.getItem(key) ?? "";
      }

      const code = generateCode();

      await RedisService.shareSession(code, session);

      sendResponse({
        success: true,
        code,
      });
    } catch (error) {
      sendResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido",
      });
    }

    return true;
  }
);

async function restoreSession() {
  try {
    if (location.pathname !== "/auth/login") {
      return;
    }

    const sessionId = new URL(location.href)
      .searchParams
      .get("sessionId");

    if (!sessionId) {
      return;
    }

    if (!isValidCode(sessionId)) {
      await Swal.fire({
        icon: "error",
        title: "Código inválido",
        text: "El código de sesión no tiene un formato válido.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const session = await RedisService.getSession(sessionId);

    if (!session) {
      await Swal.fire({
        icon: "error",
        title: "Error obteniendo sesión",
        text: "La sesión ha expirado o el código es incorrecto.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    Object.entries(session).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });

    await RedisService.deleteSession(sessionId);

    const result = await Swal.fire({
      icon: "success",
      title: "¡Sesión compartida!",
      text: "La sesión se restauró correctamente.",
      confirmButtonText: "Continuar",
    });

    if (result.isConfirmed) {
      location.href =
        "https://sgc.wowperu.pe/instalaciones-v2/lista";
    }
  } catch (error) {
    console.error(error);

    await Swal.fire({
      icon: "error",
      title: "Error inesperado",
      text:
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado",
    });
  }
}

function getToken() {
  
  const token: string | null = localStorage.getItem('token');
    Logger.setContext('SGC-AUTH');

  if (token) {
    chrome.storage.local.set({ sgcToken: token }, () => {
      Logger.info("Token sucesfully stored in chrome.storage.local.");
    });
  } else {
    Logger.warn("Not found token in localStorage. Please log in to Pronto first.");
  }
}

getToken();
restoreSession();