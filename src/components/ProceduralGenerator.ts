/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProceduralType = 'grid' | 'nebula' | 'cyberpunk' | 'inkwash';

export function generateProceduralPanorama(type: ProceduralType): string {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, width, height);

  if (type === 'grid') {
    // 1. Tron Grid Theme
    // Background space
    ctx.fillStyle = '#080812';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (height * 0.7);
      const size = Math.random() * 1.5 + 0.5;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    // Distant mountains (Wireframe)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    for (let x = 0; x <= width; x += 40) {
      // Create seamless looping mountains (same height at start and end)
      const isNearEnd = x > width - 100;
      const isNearStart = x < 100;
      let amp = 100;
      if (isNearStart) amp = (x / 100) * 100;
      if (isNearEnd) amp = ((width - x) / 100) * 100;
      
      const yOffset = Math.sin(x * 0.015) * 50 + Math.cos(x * 0.005) * 30;
      const mountainY = height * 0.55 - (Math.abs(yOffset) * (amp / 100));
      ctx.lineTo(x, mountainY);
    }
    ctx.lineTo(width, height * 0.6);
    ctx.stroke();

    // Secondary pink wireframe mountains
    ctx.strokeStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.58);
    for (let x = 0; x <= width; x += 30) {
      const isNearEnd = x > width - 100;
      const isNearStart = x < 100;
      let amp = 80;
      if (isNearStart) amp = (x / 100) * 80;
      if (isNearEnd) amp = ((width - x) / 100) * 80;

      const yOffset = Math.cos(x * 0.02 + 1) * 40 + Math.sin(x * 0.008) * 20;
      const mountainY = height * 0.58 - (Math.abs(yOffset) * (amp / 80));
      ctx.lineTo(x, mountainY);
    }
    ctx.lineTo(width, height * 0.58);
    ctx.stroke();

    // Draw Tron Sun (Equirectangular wrapped, placed at center yaw 180deg)
    const sunX = width / 2;
    const sunY = height * 0.45;
    const sunRadius = 90;
    const gradient = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
    gradient.addColorStop(0, '#fef08a');
    gradient.addColorStop(0.3, '#f97316');
    gradient.addColorStop(0.8, '#ef4444');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ground Grid (Lower half)
    const horizonY = height * 0.58;
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Draw horizontal lines converging to horizon (perspective warp)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    const linesCount = 35;
    for (let i = 0; i <= linesCount; i++) {
      const ratio = i / linesCount;
      const y = horizonY + Math.pow(ratio, 2.5) * (height - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw perspective vertical lines (converging towards horizon)
    const verticalLinesCount = 60;
    for (let i = 0; i < verticalLinesCount; i++) {
      const xStart = (i / verticalLinesCount) * width;
      ctx.beginPath();
      ctx.moveTo(xStart, height);
      // Converge towards the center of horizon to look like depth
      const xEnd = width / 2 + (xStart - width / 2) * 0.01;
      ctx.lineTo(xEnd, horizonY);
      ctx.stroke();
    }

  } else if (type === 'nebula') {
    // 2. Deep Space Nebula
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, width, height);

    // Draw space dust gradients (multiple rich colorful bubbles)
    const dusts = [
      { x: width * 0.25, y: height * 0.4, r: 400, color: 'rgba(99, 102, 241, 0.15)' },
      { x: width * 0.75, y: height * 0.4, r: 400, color: 'rgba(99, 102, 241, 0.15)' }, // Seamless repeat for left/right
      { x: width * 0.5, y: height * 0.5, r: 500, color: 'rgba(236, 72, 153, 0.12)' },
      { x: width * 0.8, y: height * 0.3, r: 350, color: 'rgba(168, 85, 247, 0.15)' },
      { x: width * 0.1, y: height * 0.3, r: 350, color: 'rgba(168, 85, 247, 0.15)' }, // Repeat
      { x: width * 0.35, y: height * 0.6, r: 300, color: 'rgba(14, 165, 233, 0.12)' },
    ];

    dusts.forEach(dust => {
      const grad = ctx.createRadialGradient(dust.x, dust.y, 10, dust.x, dust.y, dust.r);
      grad.addColorStop(0, dust.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Drawing stars
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.4;
      ctx.fillStyle = Math.random() > 0.8 ? '#a5f3fc' : '#ffffff';
      ctx.globalAlpha = Math.random() * 0.9 + 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    // Glowing big stars
    for (let i = 0; i < 15; i++) {
      const x = (i / 15) * width + (Math.random() - 0.5) * 50;
      const y = Math.random() * (height * 0.6) + 100;
      ctx.fillStyle = '#ffffff';
      
      // Star flare glow
      const g = ctx.createRadialGradient(x, y, 1, x, y, 12);
      g.addColorStop(0, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.3, 'rgba(129, 140, 248, 0.4)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant ringed planet
    const planetX = width * 0.7;
    const planetY = height * 0.45;
    const planetR = 40;
    
    // Draw rings (skewed ellipse)
    ctx.strokeStyle = 'rgba(196, 181, 253, 0.5)';
    ctx.lineWidth = 6;
    ctx.save();
    ctx.translate(planetX, planetY);
    ctx.rotate(-Math.PI / 8);
    ctx.scale(2.2, 0.4);
    ctx.beginPath();
    ctx.arc(0, 0, planetR + 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Planet body
    const planetGrad = ctx.createRadialGradient(planetX - 10, planetY - 10, 5, planetX, planetY, planetR);
    planetGrad.addColorStop(0, '#f472b6');
    planetGrad.addColorStop(0.7, '#6366f1');
    planetGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'cyberpunk') {
    // 3. Cyberpunk Neon Grid Ocean
    // Sunset gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#090514');
    skyGrad.addColorStop(0.3, '#22003c');
    skyGrad.addColorStop(0.55, '#a21caf');
    skyGrad.addColorStop(0.65, '#db2777');
    skyGrad.addColorStop(0.72, '#f43f5e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    const horizonY = height * 0.65;

    // Glowing sun (retro synthwave grid sun)
    const sunX = width / 2;
    const sunY = horizonY;
    const sunRadius = 160;

    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, Math.PI, 0); // Half circle above horizon
    ctx.clip();

    // Sun gradient
    const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY);
    sunGrad.addColorStop(0, '#facc15');
    sunGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius);

    // Grid cuts in the sun (Synthwave horizontal bars)
    ctx.fillStyle = '#22003c'; // matching deep sky color
    for (let y = sunY - sunRadius; y < sunY; y += 14) {
      // Bar width increases as we go down
      const barHeight = 2.5 + ((y - (sunY - sunRadius)) / sunRadius) * 6;
      ctx.fillRect(sunX - sunRadius, y, sunRadius * 2, barHeight);
    }
    ctx.restore();

    // Skyscraper silhouettes along the horizon
    ctx.fillStyle = '#0d041c';
    const skylineWidths = [40, 60, 30, 80, 50, 90, 70, 110, 45, 85];
    let cx = 0;
    while (cx < width) {
      const idx = Math.floor(Math.sin(cx * 0.01) * 5 + 5) % skylineWidths.length;
      const w = skylineWidths[idx];
      const h = 40 + Math.abs(Math.sin(cx * 0.005) * 80) + (cx % 3 === 0 ? 30 : 0);
      
      // Make sure left and right edges are height-matched for seamless loop
      let finalH = h;
      if (cx < 150) {
        finalH = h * (cx / 150);
      } else if (cx > width - 150) {
        finalH = h * ((width - cx) / 150);
      }

      ctx.fillRect(cx, horizonY - finalH, w, finalH);
      cx += w + 5;
    }

    // Digital ground neon ocean
    ctx.fillStyle = '#05020c';
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Draw neon horizontal perspective grid lines
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    const linesCount = 40;
    for (let i = 0; i <= linesCount; i++) {
      const ratio = i / linesCount;
      const y = horizonY + Math.pow(ratio, 2.8) * (height - horizonY);
      
      // Glow intensity increases near the horizon or bottom
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // Reset shadow

    // Perspective lines from sun-ish area
    const vCount = 80;
    for (let i = 0; i <= vCount; i++) {
      const xStart = (i / vCount) * width;
      ctx.strokeStyle = '#db2777';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(xStart, height);
      const xEnd = width / 2 + (xStart - width / 2) * 0.02;
      ctx.lineTo(xEnd, horizonY);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

  } else if (type === 'inkwash') {
    // 4. Ink Wash Painting (Classical Chinese Style)
    // Soft rice paper background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f5f4ef');
    bgGrad.addColorStop(0.7, '#e8e5d8');
    bgGrad.addColorStop(1, '#ded9c3');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const horizonY = height * 0.65;

    // Distant misty ink wash mountains
    const drawMountainRange = (baseY: number, color: string, scale: number, complexity: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= width; x += 10) {
        // High quality seamless wave formula
        const isNearEnd = x > width - 150;
        const isNearStart = x < 150;
        let amp = 1;
        if (isNearStart) amp = (x / 150);
        if (isNearEnd) amp = ((width - x) / 150);

        const wave = Math.sin(x * 0.003 * complexity) * 120 + Math.cos(x * 0.008 * complexity) * 60;
        const y = baseY + (wave * scale * amp);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    };

    // Far mountains (very light)
    drawMountainRange(horizonY - 80, 'rgba(130, 135, 125, 0.15)', 0.5, 1.2);
    // Mid-distance mountains
    drawMountainRange(horizonY - 20, 'rgba(95, 100, 92, 0.35)', 0.7, 1.8);
    // Near mountain ridges
    drawMountainRange(horizonY + 40, 'rgba(45, 48, 43, 0.6)', 0.9, 2.5);

    // Large subtle crimson sun (partially blocked by mountains)
    const sunX = width * 0.25;
    const sunY = horizonY - 120;
    const sunR = 80;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR);
    sunGrad.addColorStop(0, 'rgba(217, 70, 70, 0.45)');
    sunGrad.addColorStop(0.5, 'rgba(217, 70, 70, 0.2)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Bamboo clusters (on the sides to frame the panorama)
    const drawBamboo = (bx: number, heightScale: number) => {
      ctx.save();
      ctx.fillStyle = 'rgba(20, 22, 19, 0.85)';
      ctx.strokeStyle = 'rgba(20, 22, 19, 0.85)';
      
      // Draw bamboo stalks
      let cx = bx;
      let cy = height;
      const stalkWidth = 14 * heightScale;
      
      ctx.lineWidth = stalkWidth;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Segmented segments
      const segs = 6;
      for (let s = 0; s < segs; s++) {
        const segLen = 140 * heightScale;
        const targetX = cx + Math.sin(s * 0.2) * 10 * heightScale;
        const targetY = cy - segLen;
        ctx.lineTo(targetX, targetY);
        cy = targetY;
        cx = targetX;
      }
      ctx.stroke();

      // Draw leaves on stalk segments
      ctx.beginPath();
      // Draw artistic leaf groups
      for (let j = 2; j < segs; j++) {
        const lx = bx + Math.sin(j * 0.2) * (j * 10) * heightScale;
        const ly = height - (j * 140 * heightScale);
        
        ctx.save();
        ctx.translate(lx, ly);
        // Draw clusters of 3-4 leaves
        for (let l = 0; l < 4; l++) {
          ctx.rotate((l * Math.PI / 4) - Math.PI / 3);
          ctx.beginPath();
          ctx.ellipse(30 * heightScale, 0, 30 * heightScale, 6 * heightScale, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
    };

    // Frame left and right sides seamlessly (same positions relative to borders)
    drawBamboo(100, 1.2);
    drawBamboo(300, 0.85);
    drawBamboo(width - 300, 0.85);
    drawBamboo(width - 100, 1.2);

    // Misty water/fog effect
    const fogGrad = ctx.createLinearGradient(0, horizonY - 40, 0, height);
    fogGrad.addColorStop(0, 'rgba(245, 244, 239, 0.05)');
    fogGrad.addColorStop(0.3, 'rgba(245, 244, 239, 0.8)');
    fogGrad.addColorStop(1, 'rgba(245, 244, 239, 0.15)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizonY - 40, width, height - (horizonY - 40));

    // Simple boat silhouette at center
    const boatX = width / 2;
    const boatY = horizonY + 120;
    ctx.fillStyle = 'rgba(30, 32, 28, 0.7)';
    ctx.beginPath();
    ctx.moveTo(boatX - 35, boatY);
    ctx.quadraticCurveTo(boatX, boatY + 8, boatX + 35, boatY);
    ctx.lineTo(boatX + 25, boatY - 4);
    ctx.lineTo(boatX - 25, boatY - 4);
    ctx.closePath();
    ctx.fill();

    // Fisherman silhouette with rod
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(30, 32, 28, 0.7)';
    ctx.beginPath();
    ctx.moveTo(boatX, boatY - 4);
    ctx.lineTo(boatX - 3, boatY - 14); // fisherman body
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(boatX - 3, boatY - 16, 3, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(boatX - 3, boatY - 12);
    ctx.lineTo(boatX + 18, boatY - 26); // fishing rod
    ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
