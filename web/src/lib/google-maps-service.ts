const GOOGLE_MAPS_SCRIPT_ID = "townpass-google-maps-script";
const GOOGLE_MAPS_CALLBACK = "__townpassGoogleMapsLoaded";

declare global {
  interface Window {
    google?: {
      maps?: unknown;
    };
    __townpassGoogleMapsLoaded?: () => void;
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
    window[GOOGLE_MAPS_CALLBACK] = () => {
      resolve(undefined);
      delete window[GOOGLE_MAPS_CALLBACK];
    };

    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.maps) {
        resolve(undefined);
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    const params = new URLSearchParams({
      key: apiKey,
      loading: "async",
      libraries: "marker",
      callback: GOOGLE_MAPS_CALLBACK,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

    script.onerror = () => reject(new Error("Failed to load Google Maps script"));

    document.head.appendChild(script);
  }).catch((error) => {
    loadScriptPromise = null;
    throw error;
  });

  loadScriptPromise = promise;
  return promise;
}
