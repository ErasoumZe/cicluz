type ContentPayload = {
  url?: string | null;
  content?: string | null;
  label?: string | null;
};

type ContentItemLike = {
  type: "video" | "text" | "audio" | "image" | "file";
  title?: string;
  description?: string | null;
  payload?: ContentPayload | null;
};

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/embed/")[1]?.split("/")[0]?.trim();
        return id || null;
      }
      const v = parsed.searchParams.get("v");
      return v ? v.trim() : null;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeMediaUrl(url: string) {
  const id = getYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
}

function isEmbeddable(url: string) {
  if (url.includes("youtube.com/embed/")) return true;
  if (url.includes("player.vimeo.com/video/")) return true;
  return false;
}

export function ContentRenderer({ item }: { item: ContentItemLike }) {
  const payload = item.payload ?? {};
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const content = typeof payload.content === "string" ? payload.content : "";
  const label = typeof payload.label === "string" ? payload.label : "";

  if (item.type === "text") {
    return (
      <div className="space-y-3 text-sm leading-relaxed whitespace-pre-line">
        {content || "Sem texto cadastrado."}
      </div>
    );
  }

  if (item.type === "image") {
    if (!url) return <p className="text-sm text-muted-foreground">Sem imagem.</p>;
    return (
      <img
        src={url}
        alt={item.title ?? "Imagem"}
        className="w-full rounded-xl object-cover"
      />
    );
  }

  if (item.type === "audio") {
    if (!url) return <p className="text-sm text-muted-foreground">Sem audio.</p>;
    return <audio controls className="w-full" src={url} />;
  }

  if (item.type === "file") {
    if (!url) return <p className="text-sm text-muted-foreground">Sem arquivo.</p>;
    return (
      <a
        href={url}
        className="inline-flex items-center gap-2 text-sm text-primary underline"
        target="_blank"
        rel="noreferrer"
      >
        {label || "Baixar arquivo"}
      </a>
    );
  }

  if (!url) {
    return <p className="text-sm text-muted-foreground">Sem video.</p>;
  }

  const normalized = normalizeMediaUrl(url);
  const useIframe = isEmbeddable(normalized) || normalized.includes("youtube.com");

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {useIframe ? (
        <iframe
          src={normalized}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video className="w-full h-full" controls playsInline src={normalized} />
      )}
    </div>
  );
}
