"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type ContentType = "link" | "texto" | "telefone" | "email" | "wifi" | "outro";
type DotShape = "square" | "rounded" | "circle" | "extra";
type Theme = "dark" | "light";
type ErrorCorrection = "L" | "M" | "Q" | "H";

const errorLevels: Array<{ id: ErrorCorrection; label: string; description: string }> = [
  { id: "L", label: "Baixa", description: "Mais simples" },
  { id: "M", label: "Media", description: "Equilibrada" },
  { id: "Q", label: "Alta", description: "Mais segura" },
  { id: "H", label: "Maxima", description: "Ideal com logo" },
];

const contentTypes: Array<{ id: ContentType; label: string; icon: string }> = [
  { id: "link", label: "Link", icon: "↗" },
  { id: "texto", label: "Texto", icon: "T" },
  { id: "telefone", label: "Telefone", icon: "☏" },
  { id: "email", label: "Email", icon: "✉" },
  { id: "wifi", label: "Wi-Fi", icon: "≋" },
  { id: "outro", label: "Outro", icon: "•••" },
];

const dotShapes: Array<{ id: DotShape; label: string }> = [
  { id: "square", label: "Quadrado" },
  { id: "rounded", label: "Arredondado" },
  { id: "circle", label: "Circular" },
  { id: "extra", label: "Extra arredondado" },
];

const placeholders: Record<ContentType, string> = {
  link: "https://www.exemplo.com",
  texto: "Digite seu texto aqui",
  telefone: "+55 11 99999-9999",
  email: "contato@exemplo.com",
  wifi: "WIFI:T:WPA;S:Minha Rede;P:minhasenha;;",
  outro: "https://openai.com",
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawFinder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  color: string,
  background: string,
) {
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, cell * 7, cell * 7, cell * 1.6);
  ctx.fillStyle = background;
  drawRoundedRect(ctx, x + cell, y + cell, cell * 5, cell * 5, cell * 1.2);
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.9);
}

function isFinderCell(row: number, col: number, count: number) {
  const inTop = row < 7;
  const inLeft = col < 7;
  const inRight = col >= count - 7;
  const inBottom = row >= count - 7;
  return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
}

export default function Home() {
  const [contentType, setContentType] = useState<ContentType>("link");
  const [value, setValue] = useState(placeholders.link);
  const [qrColor, setQrColor] = useState("#2563EB");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [shape, setShape] = useState<DotShape>("square");
  const [size, setSize] = useState(350);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [showHelp, setShowHelp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrection>("H");
  const [quietZone, setQuietZone] = useState(8);
  const [shadowStrength, setShadowStrength] = useState(18);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const encodedValue = useMemo(() => {
    const trimmed = value.trim() || placeholders[contentType];
    if (contentType === "telefone") return `tel:${trimmed}`;
    if (contentType === "email") return `mailto:${trimmed}`;
    return trimmed;
  }, [contentType, value]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("qr-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("qr-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isActive = true;

    async function renderQr() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const generated = QRCode.create(encodedValue, {
        errorCorrectionLevel: includeLogo && errorCorrection !== "H" ? "H" : errorCorrection,
        margin: 0,
      });

      const ctx = canvas.getContext("2d");
      if (!ctx || !isActive) return;

      const pixelRatio = window.devicePixelRatio || 1;
      const canvasSize = size * pixelRatio;
      const padding = Math.round(size * (quietZone / 100)) * pixelRatio;
      const count = generated.modules.size;
      const usable = canvasSize - padding * 2;
      const cell = usable / count;
      const { r, g, b } = hexToRgb(qrColor);

      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowStrength / 100})`;
      ctx.shadowBlur = cell * 0.22;

      for (let row = 0; row < count; row += 1) {
        for (let col = 0; col < count; col += 1) {
          if (!generated.modules.get(row, col) || isFinderCell(row, col, count)) continue;

          const x = padding + col * cell;
          const y = padding + row * cell;
          const dotSize = cell * (shape === "circle" ? 0.72 : 0.84);
          const offset = (cell - dotSize) / 2;
          ctx.fillStyle = qrColor;

          if (shape === "circle") {
            ctx.beginPath();
            ctx.arc(x + cell / 2, y + cell / 2, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const radius =
              shape === "square" ? cell * 0.08 : shape === "rounded" ? cell * 0.22 : cell * 0.36;
            drawRoundedRect(ctx, x + offset, y + offset, dotSize, dotSize, radius);
          }
        }
      }

      ctx.shadowBlur = 0;
      drawFinder(ctx, padding, padding, cell, qrColor, bgColor);
      drawFinder(ctx, padding + (count - 7) * cell, padding, cell, qrColor, bgColor);
      drawFinder(ctx, padding, padding + (count - 7) * cell, cell, qrColor, bgColor);

      if (includeLogo) {
        const center = canvasSize / 2;
        const badge = canvasSize * 0.17;
        const gradient = ctx.createLinearGradient(center - badge, center - badge, center + badge, center + badge);
        gradient.addColorStop(0, "#38BDF8");
        gradient.addColorStop(1, "#7C3AED");
        ctx.fillStyle = bgColor;
        drawRoundedRect(ctx, center - badge / 2, center - badge / 2, badge, badge, badge * 0.26);
        ctx.fillStyle = gradient;
        ctx.font = `800 ${badge * 0.72}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Q", center, center + badge * 0.05);
      }
    }

    renderQr();
    return () => {
      isActive = false;
    };
  }, [encodedValue, qrColor, bgColor, shape, size, includeLogo, errorCorrection, quietZone, shadowStrength]);

  function changeType(type: ContentType) {
    setContentType(type);
    setValue(placeholders[type]);
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        await navigator.clipboard.writeText(encodedValue);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }
    });
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function resetAdvanced() {
    setErrorCorrection("H");
    setQuietZone(8);
    setShadowStrength(18);
  }

  return (
    <main className={`app-shell min-h-screen overflow-hidden text-white ${theme === "light" ? "is-light" : ""}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.14),transparent_30%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-8 px-6 py-8 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="grid h-12 w-12 place-items-center rounded-[8px] border border-[#7657ff] bg-[#101827] text-3xl text-[#8b6cff] shadow-[0_0_24px_rgba(99,102,241,0.28)]">
              ⌗
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-normal md:text-3xl">QR Code Generator</h1>
              <p className="mt-1 text-sm text-slate-300 md:text-base">Crie, personalize e baixe seu QR Code</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="icon-button"
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? "☼" : "☾"}
            </button>
            <button
              className={`theme-toggle ${theme === "light" ? "is-light" : ""}`}
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              aria-pressed={theme === "light"}
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={toggleTheme}
            >
              <span />
            </button>
            <button className="help-button" onClick={() => setShowHelp(true)}>ⓘ Como funciona?</button>
          </div>
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-3">
            <Panel title="1. Conteúdo" description="Escolha o tipo de conteúdo e insira os dados">
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`type-button ${contentType === type.id ? "is-active" : ""}`}
                    onClick={() => changeType(type.id)}
                  >
                    <span className="text-xl leading-none">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
              <label className="field-label" htmlFor="qr-content">
                Seu {contentType === "link" ? "link" : contentTypes.find((type) => type.id === contentType)?.label.toLowerCase()}
              </label>
              <div className="text-input-wrap">
                <span>↗</span>
                <input id="qr-content" value={value} onChange={(event) => setValue(event.target.value)} />
                <button aria-label="Limpar conteúdo" onClick={() => setValue("")}>
                  ×
                </button>
              </div>
            </Panel>

            <Panel title="2. Personalização" description="Personalize o design do seu QR Code">
              <div className="grid gap-3 md:grid-cols-2">
                <ColorField label="Cor do QR Code" value={qrColor} onChange={setQrColor} />
                <ColorField label="Cor de fundo" value={bgColor} onChange={setBgColor} />
              </div>
              <label className="field-label">Formato dos pontos</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {dotShapes.map((item) => (
                  <button
                    key={item.id}
                    className={`shape-button ${shape === item.id ? "is-active" : ""}`}
                    onClick={() => setShape(item.id)}
                  >
                    <span className={`shape-preview ${item.id}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <label className="field-label">Logo no centro (opcional)</label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className={`logo-preview ${includeLogo ? "is-active" : ""}`}
                  onClick={() => setIncludeLogo((current) => !current)}
                  aria-label="Alternar logo central"
                >
                  Q
                </button>
                <button className="secondary-button" onClick={() => setIncludeLogo((current) => !current)}>
                  ⇧ Alterar logo
                </button>
                <span className="text-sm text-slate-400">Recomendado: PNG ou SVG</span>
              </div>
            </Panel>

            <Panel title="3. Tamanho" description="Escolha o tamanho do seu QR Code">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    className="range"
                    type="range"
                    min="128"
                    max="1024"
                    step="1"
                    value={size}
                    onChange={(event) => setSize(Number(event.target.value))}
                  />
                  <div className="mt-3 flex justify-between text-sm text-slate-300">
                    <span>128px</span>
                    <span>256px</span>
                    <span>512px</span>
                    <span>1024px</span>
                  </div>
                </div>
                <div className="size-box">
                  <input value={size} onChange={(event) => setSize(Number(event.target.value) || 128)} />
                  <span>px</span>
                </div>
              </div>
            </Panel>

            <section className={`advanced-panel ${showAdvanced ? "is-open" : ""}`}>
              <button
                className="advanced-button"
                aria-expanded={showAdvanced}
                aria-controls="advanced-options"
                onClick={() => setShowAdvanced((current) => !current)}
              >
                <span>⚙ Opções avançadas</span>
                <span className="advanced-chevron">⌄</span>
              </button>

              {showAdvanced ? (
                <div id="advanced-options" className="advanced-content">
                  <div>
                    <div className="advanced-row-title">
                      <span>Correção de erro</span>
                      <small>{includeLogo ? "Maxima aplicada por causa do logo" : "Define a tolerancia de leitura"}</small>
                    </div>
                    <div className="error-grid">
                      {errorLevels.map((level) => (
                        <button
                          key={level.id}
                          className={`error-button ${errorCorrection === level.id ? "is-active" : ""}`}
                          onClick={() => setErrorCorrection(level.id)}
                        >
                          <strong>{level.label}</strong>
                          <span>{level.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="advanced-slider">
                    <span>
                      Margem de leitura
                      <strong>{quietZone}%</strong>
                    </span>
                    <input
                      className="range"
                      type="range"
                      min="4"
                      max="16"
                      value={quietZone}
                      onChange={(event) => setQuietZone(Number(event.target.value))}
                    />
                  </label>

                  <label className="advanced-slider">
                    <span>
                      Brilho dos pontos
                      <strong>{shadowStrength}%</strong>
                    </span>
                    <input
                      className="range"
                      type="range"
                      min="0"
                      max="40"
                      value={shadowStrength}
                      onChange={(event) => setShadowStrength(Number(event.target.value))}
                    />
                  </label>

                  <button className="reset-button" onClick={resetAdvanced}>
                    Restaurar padrao
                  </button>
                </div>
              ) : null}
            </section>
          </div>

          <section className="preview-panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-normal">Preview</h2>
                <p className="mt-1 text-sm text-slate-300 md:text-base">Escaneie para testar seu QR Code</p>
              </div>
              <button className="test-button">⌘ Teste de leitura</button>
            </div>

            <div className="qr-stage">
              <canvas ref={canvasRef} aria-label="Preview do QR Code gerado" />
            </div>

            <div className="tip-box">
              <span>ⓘ</span>
              <p>Dica: QR Codes com logo podem ter menor taxa de leitura. Mantenha contraste alto entre o QR Code e o fundo.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button className="download-button" onClick={downloadPng}>
                ⇩ Baixar PNG
              </button>
              <button className="copy-button" onClick={copyQr}>
                ⧉ {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </section>
        </div>
      </section>

      {showHelp ? (
        <div className="help-overlay" role="presentation" onClick={() => setShowHelp(false)}>
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="help-title">Como funciona?</h2>
                <p>Preencha o conteúdo, ajuste o visual e use o preview para testar antes de baixar.</p>
              </div>
              <button aria-label="Fechar ajuda" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <ol>
              <li>Escolha o tipo de QR Code e edite o campo principal.</li>
              <li>Personalize cor, fundo, formato dos pontos, logo e tamanho.</li>
              <li>Escaneie o preview. Depois baixe o PNG ou copie a imagem.</li>
            </ol>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="control-panel">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="field-label mb-2">{label}</span>
      <span className="color-field">
        <span>↗</span>
        <input value={value.toUpperCase()} onChange={(event) => onChange(event.target.value)} aria-label={label} />
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label} seletor`} />
      </span>
    </label>
  );
}
