let img;
let pointsData = [];
let scrollX = 0;
const SCROLL_SPEED = 0.3; // pixels por frame

// Instância da Headline e Logotipo
let mainHeadline;
let centralLogo;
let mainButton;

function preload() {
  img = loadImage('backgownd.png');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');

  img.loadPixels();
  calculateGrid();
  updateDate();

  let subLinesMobile = [
    "Acesse ativos de alta performance",
    "em qualquer região e opere com",
    "a precisão da inteligência artificial",
    "integrada ao seu atendimento"
  ];

  let subLinesDesktop = [
    "Acesse ativos de alta performance em qualquer região e opere com a",
    "precisão da inteligência artificial integrada ao seu atendimento"
  ];

  // Condicional Mobile
  let selectedSubLines = width < 768 ? subLinesMobile : subLinesDesktop;

  // Headlines condicional
  let headlines = width < 768 
    ? ["O ecossistema", "imobiliário agora", "sem fronteiras"]
    : ["O ecossistema imobiliário", "agora sem fronteiras"];

  // Inicializa a Headline
  mainHeadline = new HeadlineReveal(
    headlines,
    selectedSubLines,
    width < 768 ? 20 : width / 2,
    height * 0.38,
    _headFontSize(),
    _subFontSize(),
    width < 768 // isLeftAligned
  );

  // Inicialização do Botão
  mainButton = new ScanningButton("Em breve...", width < 768 ? 20 : width / 2, getButtonY(), width < 768);

  // Inicialização do Logotipo Animado Canvas (40% menor em Mobile)
  let logoSize = width < 768 ? 60 * 0.6 : 60;
  centralLogo = new CanvasLogo(width / 2, getLogoY(), logoSize, logoSize);
}

// Ocupar +- 80% do texto em "fronteiras" dinamicamente reduzindo em Mobile ou mantendo grande no desk
function _headFontSize() { return width < 768 ? 42 : width > 1024 ? 72 : 50; }
function _subFontSize() { return width < 768 ? 16 : width > 1024 ? 16 : 14; }

function calculateGrid() {
  pointsData = [];
  let imgW = img.width;
  let imgH = img.height;
  if (imgW <= 0 || imgH <= 0) return;
  let imgRatio = imgW / imgH;
  let canvasRatio = width / height;
  let s, offX = 0, offY = 0;
  let yShift = 60;
  if (canvasRatio > imgRatio) {
    s = width / imgW;
    offY = (height - imgH * s) / 2 + yShift;
  } else {
    s = height / imgH;
    offX = (width - imgW * s) / 2;
    offY = yShift;
  }
  let spacing = 4;
  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      let ix = floor((x - offX) / s);
      let iy = floor((y - offY) / s);
      if (ix >= 0 && ix < imgW && iy >= 0 && iy < imgH) {
        let index = (ix + iy * imgW) * 4;
        let br = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
        if (br < 230) {
          let w = map(br, 0, 230, spacing * 0.85, spacing * 0.04);
          pointsData.push({ x: x, y: y, weight: w });
        }
      }
    }
  }
}

function draw() {
  background('#000000');
  stroke(2, 223, 130, 75);
  scrollX += SCROLL_SPEED;
  let offset = scrollX % width;
  for (let i = 0; i < pointsData.length; i++) {
    let p = pointsData[i];
    let px = p.x - offset;
    strokeWeight(p.weight);
    point(px, p.y);
    point(px + width, p.y);
  }
  noStroke();
  let gradientStart = height;
  let gradientEnd = width < 768 ? height * 0.45 : height * 0.6; // Névoa alongada em telas portrait
  for (let y = gradientStart; y > gradientEnd; y--) {
    let alpha = map(y, gradientStart, gradientEnd, 255, 0);
    fill(0, 0, 0, alpha);
    rect(0, y, width, 1);
  }
  if (width > 768) {
    mainHeadline.display();
    centralLogo.display();
  } else {
    mainHeadline.display();
    mainButton.display();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateGrid();

  let subLinesMobile = [
    "Acesse ativos de alta performance",
    "em qualquer região e opere com",
    "a precisão da inteligência artificial",
    "integrada ao seu atendimento"
  ];
  let subLinesDesktop = [
    "Acesse ativos de alta performance em qualquer região e opere com a",
    "precisão da inteligência artificial integrada ao seu atendimento"
  ];

  let headlines = width < 768 
    ? ["O ecossistema", "imobiliário agora", "sem fronteiras"]
    : ["O ecossistema imobiliário", "agora sem fronteiras"];

  mainHeadline.headlines = headlines;
  mainHeadline.subLines = width < 768 ? subLinesMobile : subLinesDesktop;
  mainHeadline.isLeftAligned = width < 768;
  mainHeadline.recenter(width < 768 ? 20 : width / 2, height * 0.38, _headFontSize(), _subFontSize());
  
  mainButton.isLeftAligned = width < 768;
  mainButton.recenter(width < 768 ? 20 : width / 2, getButtonY());
  centralLogo.recenter(width / 2, getLogoY());
}

// ─────────────────────────────────────────────────────────────────────────────
// Classe HeadlineReveal
// Fade-in e Scanner sincronizados para Headline E Subtexto.
// ─────────────────────────────────────────────────────────────────────────────
class HeadlineReveal {
  constructor(headlines, subLines, x, y, headSize, subSize, isLeftAligned = false) {
    this.headlines = Array.isArray(headlines) ? headlines : [headlines];
    this.subLines = subLines;
    this.x = x;
    this.y = y;
    this.headSize = headSize;
    this.subSize = subSize;
    this.isLeftAligned = isLeftAligned;
    this.startTime = millis();

    this.fadeInHead = 500; // Fade-in headline (0.4s)
    this.fadeInSub = 500; // Fade-in subtexto SUPER rápido (0.25s)
    this.scanDuration = 2000; // Scanner rápido (0.6s)
    this.beamWidth = 6;
  }

  recenter(x, y, headSize, subSize) {
    this.x = x;
    this.y = y;
    this.headSize = headSize;
    this.subSize = subSize;
  }

  _drawLine(lineStr, cx, cy, fontSize, weight, opacity, beamPos, isSubtitle = false) {
    textFont('Inter');
    textStyle(weight);
    textSize(fontSize);
    textAlign(LEFT, CENTER);
    let chars = lineStr.split('');
    let totalW = textWidth(lineStr);
    let curX = this.isLeftAligned ? cx : cx - totalW / 2;

    for (let i = 0; i < chars.length; i++) {
      let dist = abs(i - beamPos);
      let beamIntensity = exp(-pow(dist / this.beamWidth, 2));
      beamIntensity = constrain(beamIntensity, 0, 1);

      // Headline usa scanner verde -> branco. Subtítulo usa scanner branco -> cinza.
      let r, g, b;
      if (!isSubtitle) {
        r = lerp(255, 2, beamIntensity);
        g = lerp(255, 223, beamIntensity);
        b = lerp(255, 130, beamIntensity);
      } else {
        // Subtítulo: base 180 (cinza), scanner puxa para 255 (branco)
        let c = lerp(180, 255, beamIntensity);
        r = g = b = c;
      }

      fill(r, g, b, opacity);
      noStroke();
      text(chars[i], curX, cy);
      curX += textWidth(chars[i]);
    }
  }

  display() {
    push();
    let elapsed = millis() - this.startTime;

    // 1. Fade-ins Independentes e Slide-Up
    let headOpacity = constrain(map(elapsed, 0, this.fadeInHead, 0, 255), 0, 255);
    let subOpacity = constrain(map(elapsed, 0, this.fadeInSub, 0, 255), 0, 255);

    // Movimento de Deslizar (Slide Up) usando easing cubic-out
    let headProgress = constrain(elapsed / this.fadeInHead, 0, 1);
    let subProgress = constrain(elapsed / this.fadeInSub, 0, 1);

    let headEase = 1 - Math.pow(1 - headProgress, 3);
    let subEase = 1 - Math.pow(1 - subProgress, 3);

    let headYOffset = map(headEase, 0, 1, 40, 0); // Desliza de 40px abaixo para 0
    let subYOffset = map(subEase, 0, 1, 40, 0);

    // 2. Scanner Sincronizado (Ida e Volta)
    let scanProgress = constrain(elapsed / this.scanDuration, 0, 1);
    let beamNorm = scanProgress < 0.5 ? map(scanProgress, 0, 0.5, 0, 1) : map(scanProgress, 0.5, 1, 1, 0);

    // 3. Renderização
    let headLeading = this.headSize * 1.2;
    // Headlines
    for (let i = 0; i < this.headlines.length; i++) {
        let lineY = this.y - (this.headlines.length - 1 - i * 2) * headLeading * 0.5;
        this._drawLine(this.headlines[i], this.x, lineY + headYOffset, this.headSize, NORMAL, headOpacity, beamNorm * (this.headlines[i].length - 1));
    }

    // Subtítulo
    let subLeading = this.subSize * 1.7;
    let subStartY = this.y + (this.headlines.length * headLeading * 0.5) + headLeading * 0.8;
    for (let i = 0; i < this.subLines.length; i++) {
      let lineY = subStartY + i * subLeading;
      this._drawLine(this.subLines[i], this.x, lineY + subYOffset, this.subSize, NORMAL, subOpacity, beamNorm * (this.subLines[i].length - 1), true);
    }

    pop();
  }
}

function updateDate() {
  const now = new Date();
  const optionsDay = { weekday: 'long' };
  const optionsFull = { month: 'long', day: 'numeric', year: 'numeric' };

  let day = now.toLocaleDateString('pt-BR', optionsDay);
  day = day.charAt(0).toUpperCase() + day.slice(1);

  let fullDate = now.toLocaleDateString('pt-BR', optionsFull);

  const dayEl = document.getElementById('current-day');
  const dateEl = document.getElementById('current-date');

  if (dayEl) dayEl.innerText = day;
  if (dateEl) dateEl.innerText = fullDate;
}

// Utils: Posições dinânicas
function getBaseY() {
  let headSize = _headFontSize();
  let subSize = _subFontSize();
  let headLeading = headSize * 1.2;
  let subLeading = subSize * 1.7;
  let y = height * 0.38;
  let headlinesCount = width < 768 ? 3 : 2;
  let subStartY = y + (headlinesCount * headLeading * 0.5) + headLeading * 0.8;
  let totalSubLines = width < 768 ? 4 : 2;
  let lastSubLineY = subStartY + ((totalSubLines - 1) * subLeading);
  return lastSubLineY;
}

function getButtonY() {
  return getBaseY() + 50;
}

function getLogoY() {
  if (width < 768) {
    return getButtonY() + 80;
  } else {
    return getBaseY() + 80;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Classe ScanningButton
// Botão sofisticado com efeito de scan contínuo em loop.
// ─────────────────────────────────────────────────────────────────────────────
class ScanningButton {
  constructor(label, x, y, isLeftAligned = false) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = 140;
    this.h = 38;
    this.r = 10;
    this.isLeftAligned = isLeftAligned;
    this.beamWidth = 8;
  }

  recenter(x, y) {
    this.x = x;
    this.y = y;
  }

  display() {
    let t = millis();
    // Ciclo de 4 segundos: 2s de animação (ida e volta) + 2s de pausa
    let cycle = 4000;
    let progress = (t % cycle) / cycle;
    let beamNorm;
    
    if (progress < 0.5) {
      // Período de animação (primeiros 2s) - Apenas ida
      beamNorm = map(progress * 2, 0, 1, 0, 1);
    } else {
      // Período de pausa (últimos 2s)
      beamNorm = -10; // Fora do alcance
    }

    push();
    translate(this.x, this.y);
    rectMode(CENTER);
    
    // Alinhamento horizontal do botão
    if (this.isLeftAligned) translate(this.w / 2, 0);

    // Corpo do Botão (Verde Haus)
    noStroke();
    fill(2, 223, 130);
    rect(0, 0, this.w, this.h, this.r);

    // Texto com efeito de Scanner (Branco)
    textAlign(CENTER, CENTER);
    textFont('Inter');
    textStyle(NORMAL);
    textSize(13);
    
    let chars = this.label.split('');
    let totalW = textWidth(this.label);
    let curX = -totalW / 2;
    let beamPos = beamNorm * (chars.length - 1);

    for (let i = 0; i < chars.length; i++) {
        let dist = abs(i - beamPos);
        let intensity = exp(-pow(dist / this.beamWidth, 2));
        intensity = constrain(intensity, 0, 1);
        
        // Texto base preto, scanner puxa para branco
        let c = lerp(0, 255, intensity);
        fill(c);
        text(chars[i], curX + textWidth(chars[i])/2, 0);
        curX += textWidth(chars[i]);
    }
    pop();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Classe CanvasLogo
// Animação Elástica em p5js (Movimento de Cartas em Leque)
// ─────────────────────────────────────────────────────────────────────────────
class CanvasLogo {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.entranceTime = 1000;
    this.triggerTime = 2000;
    this.hoverFactor = 0; // 0 = normal, 1 = mouse sobre (fechado)
  }

  recenter(x, y) {
    this.x = x;
    this.y = y;
  }

  easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
  }

  display() {
    let t = millis();

    // 1. Entrance Fade & Slide Up
    let entranceProgress = constrain((t - this.entranceTime) / 1000, 0, 1);
    let entEase = this.easeOutQuint(entranceProgress);
    let alpha = entEase * 255;
    let mainYOffset = map(entEase, 0, 1, 40, 0);

    if (alpha <= 0) return;

    // 2. Lógica de Hover (Inversão)
    // Detectar se o mouse está sobre a área do logo (considerando o deslocamento Y)
    let currentY = this.y + mainYOffset;
    let isHovering = mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 &&
                     mouseY > currentY - this.h / 2 && mouseY < currentY + this.h / 2;

    // Suavizar a transição do hover factor
    let hoverTarget = isHovering ? 1 : 0;
    this.hoverFactor = lerp(this.hoverFactor, hoverTarget, 0.15);

    // 3. Animação de Rotação Base (A partir dos 2s)
    let animDuration = 1500;
    let c1Progress = constrain((t - this.triggerTime) / animDuration, 0, 1);
    let c1Ease = this.easeOutQuint(c1Progress);
    
    // O ângulo final é afetado pelo hoverFactor: 
    // Se hoverFactor = 1, o ângulo vai para 0 (fecha o leque)
    let angleMaxC1 = -20 * (1 - this.hoverFactor);
    let angleMaxC2 = -8 * (1 - this.hoverFactor);

    let c1Rot = map(c1Ease, 0, 1, 0, angleMaxC1) * (PI / 180);

    let delay = 100;
    let c2Progress = constrain((t - (this.triggerTime + delay)) / (animDuration - delay), 0, 1);
    let c2Ease = this.easeOutQuint(c2Progress);
    let c2Rot = map(c2Ease, 0, 1, 0, angleMaxC2) * (PI / 180);

    // Border radius progressivo: 10px no mobile (320px) até 18px no desktop (1200px+)
    let r = map(width, 320, 1200, 10, 18);
    r = constrain(r, 10, 18);

    push();
    translate(this.x, currentY);
    rectMode(CENTER);
    noStroke();

    // Feedback visual de escala no hover
    let scaleVal = map(this.hoverFactor, 0, 1, 1, 1.05);
    scale(scaleVal);

    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 6;
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = `rgba(0, 0, 0, ${entEase * 0.35})`;

    // Card 3 (Branco Base)
    push();
    fill(250, 250, 250, alpha);
    rect(0, 0, this.w, this.h, r);
    pop();

    // Card 2 (Verde Médio Escuro)
    push();
    translate(-this.w / 2, this.h / 2);
    rotate(c2Rot);
    translate(this.w / 2, -this.h / 2);
    fill(0, 88, 64, alpha);
    rect(0, 0, this.w, this.h, r);
    pop();

    // Card 1 (Verde Haus Topo)
    push();
    translate(-this.w / 2, this.h / 2);
    rotate(c1Rot);
    translate(this.w / 2, -this.h / 2);
    fill(2, 223, 130, alpha);
    rect(0, 0, this.w, this.h, r);
    pop();

    pop();
  }
}

function toggleMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('side-menu');
  const overlay = document.getElementById('side-menu-overlay');
  
  btn.classList.toggle('open');
  menu.classList.toggle('open');
  overlay.classList.toggle('open');
}
