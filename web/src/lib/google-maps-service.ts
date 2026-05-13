const GOOGLE_MAPS_SCRIPT_ID = "townpass-google-maps-script";

declare global {
  interface Window {
    google?: {
      maps?: unknown;
    };
  }
}

let loadScriptPromise: Promise<void> | null = null;

export async function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (!apiKey) {
    throw new Error("Google Maps API key is missing");
  }

  if (window.google?.maps) {
    return;
  }

  if (loadScriptPromise) {
    return loadScriptPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(undefined), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load existing Google Maps script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;

    script.onload = () => resolve(undefined);
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));

    document.head.appendChild(script);
  }).catch((error) => {
    loadScriptPromise = null;
    throw error;
  });

  loadScriptPromise = promise;
  return promise;
}
