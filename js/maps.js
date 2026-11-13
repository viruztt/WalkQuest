/* WalkQuest map catalogue. All worlds, names and lore are original. */
(function () {
  // Deterministic random so scenery looks the same every visit.
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const MAPS = [
    {
      id: 'pixel-plains',
      name: 'Pixel Plains',
      genre: 'Retro platformer',
      tagline: 'A blocky, sunny warm-up through 8-bit hills.',
      km: 1,
      unlockKm: 0,
      theme: { bg1: '#5ec8f2', bg2: '#bdf0ff', ground: '#4caf50', path: '#f5d76e', pathEdge: '#8d6e3f', accent: '#ffcc00', text: '#13233a', fog: false },
      route: 'M60,520 C160,540 220,430 320,440 S470,540 560,470 S700,330 800,360 S930,260 950,130',
      landmarks: [
        { at: 0, icon: '🏁', name: 'Start Pipe', lore: 'A green pipe hums with possibility. Your quest begins.' },
        { at: 0.3, icon: '🍄', name: 'Mushroom Meadow', lore: 'Giant spotted mushrooms bounce in the breeze. Do not eat the purple ones.' },
        { at: 0.62, icon: '🧱', name: 'Brick Bridge', lore: 'Each brick sounds hollow. Something shiny might be hidden inside.' },
        { at: 1, icon: '🏰', name: 'Flagpole Fort', lore: 'You reach the top of the flagpole. Fireworks! Level clear.' }
      ],
      collectibles: [
        { at: 0.18, icon: '🪙', name: 'Golden Coin', lore: 'Worth exactly one extra life in some economies.' },
        { at: 0.47, icon: '⭐', name: 'Bounce Star', lore: 'Warm to the touch. Makes you feel briefly invincible.' },
        { at: 0.85, icon: '🎮', name: 'Old Cartridge', lore: 'Blow into it twice before use. Tradition.' }
      ],
      encounters: [
        { icon: '🐢', text: 'A spiky shell is sliding toward you!' },
        { icon: '👾', text: 'A pixel invader swoops down from the sky!' }
      ]
    },
    {
      id: 'ashfall-hollow',
      name: 'Ashfall Hollow',
      genre: 'Psychological horror',
      tagline: 'A lakeside town lost in fog. Ash falls like snow. The radio crackles.',
      km: 2.5,
      unlockKm: 0,
      theme: { bg1: '#3b403f', bg2: '#8b918c', ground: '#55594f', path: '#c9c4b3', pathEdge: '#2b2b28', accent: '#c0392b', text: '#f1efe8', fog: true },
      route: 'M70,110 C200,90 260,200 220,280 S120,420 250,480 S480,520 540,420 S560,240 700,230 S900,330 860,470 S760,560 930,540',
      landmarks: [
        { at: 0, icon: '🚏', name: 'Rusted Bus Stop', lore: 'The last bus left in 1987. The timetable is written in someone\'s handwriting.' },
        { at: 0.22, icon: '🏨', name: 'Lakeview Motel', lore: 'Room 9 has its light on. Every other room is boarded up.' },
        { at: 0.45, icon: '⛪', name: 'Chapel of Quiet Bells', lore: 'The bells ring with no wind. You count the chimes: thirteen.' },
        { at: 0.7, icon: '🏥', name: 'St. Wren Infirmary', lore: 'The corridors stretch further inside than the building outside allows.' },
        { at: 1, icon: '🌫️', name: 'The Lantern Pier', lore: 'At the end of the pier the fog parts. You can see the way home.' }
      ],
      collectibles: [
        { at: 0.12, icon: '📻', name: 'Crackling Radio', lore: 'Static grows louder when danger is near. Useful.' },
        { at: 0.36, icon: '🗝️', name: 'Motel Key No. 9', lore: 'The tag says "Do not return".' },
        { at: 0.58, icon: '🔦', name: 'Flickering Flashlight', lore: 'Batteries: almost.' },
        { at: 0.88, icon: '📜', name: 'Torn Diary Page', lore: '"...the town only shows you what you bring into it..."' }
      ],
      encounters: [
        { icon: '👁️', text: 'The radio screams static. Something is following you through the fog.' },
        { icon: '🕯️', text: 'The air raid siren wails. The world begins to rust. Move!' },
        { icon: '🦴', text: 'Shuffling footsteps behind you, getting closer.' }
      ]
    },
    {
      id: 'mercy-city',
      name: 'Mercy City Outbreak',
      genre: 'Survival horror',
      tagline: 'A pharma-company town gone wrong. Reach the rooftop extraction before dawn.',
      km: 4,
      unlockKm: 3,
      theme: { bg1: '#0d1424', bg2: '#2a3654', ground: '#1b2233', path: '#d9d4c7', pathEdge: '#3a0d0d', accent: '#e53935', text: '#f4f4f4', fog: false },
      route: 'M60,540 L60,420 L240,420 L240,300 L120,300 L120,120 L380,120 L380,260 L560,260 L560,460 L760,460 L760,220 L940,220 L940,70',
      landmarks: [
        { at: 0, icon: '🚓', name: 'Crashed Patrol Car', lore: 'Radio still on: "...all units, quarantine perimeter is fail—"' },
        { at: 0.18, icon: '🏛️', name: 'Precinct 7', lore: 'A grand old museum converted into a police station. Odd statues. Odder puzzles.' },
        { at: 0.4, icon: '🚇', name: 'Lindell St. Subway', lore: 'Trains stopped mid-tunnel. The emergency lights blink red.' },
        { at: 0.62, icon: '🧪', name: 'Halcyon Biotech Labs', lore: 'Containment door 3B is open. It should not be open.' },
        { at: 0.84, icon: '🏬', name: 'Downtown Mall', lore: 'Muzak still plays. Something knocks over a display in aisle 4.' },
        { at: 1, icon: '🚁', name: 'Rooftop Helipad', lore: 'Rotors roar overhead. You made it out. Barely.' }
      ],
      collectibles: [
        { at: 0.1, icon: '🌿', name: 'Remedy Herb', lore: 'Bitter, but it patches you right up.' },
        { at: 0.32, icon: '💾', name: 'Typewriter Ribbon', lore: 'One save. Use it wisely.' },
        { at: 0.52, icon: '🧬', name: 'Viral Sample V-13', lore: 'Do. Not. Drop.' },
        { at: 0.74, icon: '🪪', name: 'Lab Keycard', lore: 'Clearance level: Researcher. Owner: missing.' },
        { at: 0.93, icon: '🔫', name: 'Prototype Rail Pistol', lore: 'Unfortunately out of charge. Looks cool though.' }
      ],
      encounters: [
        { icon: '🧟', text: 'A horde shambles out of the alley. Pick up the pace!' },
        { icon: '🐕', text: 'Infected dogs crash through a window!' },
        { icon: '🦾', text: 'A towering pursuer in a trench coat is stomping after you.' }
      ]
    },
    {
      id: 'kestrel-station',
      name: 'Derelict Station Kestrel',
      genre: 'Sci-fi survival',
      tagline: 'A silent space station. Life support is failing. Walk the ring to the escape pod.',
      km: 6,
      unlockKm: 10,
      theme: { bg1: '#02030a', bg2: '#141a33', ground: '#1c2440', path: '#62f0ff', pathEdge: '#0a3e4a', accent: '#62f0ff', text: '#e8f6ff', fog: false },
      route: 'M500,540 C250,540 90,450 90,300 S250,60 500,60 S910,150 910,300 S760,500 600,480 S360,420 360,300 S430,170 520,170 S640,230 640,300',
      landmarks: [
        { at: 0, icon: '🛰️', name: 'Docking Bay 3', lore: 'Your shuttle locks in. Nobody answers the hail.' },
        { at: 0.2, icon: '🧑‍🚀', name: 'Crew Quarters', lore: 'Twelve bunks. Twelve unfinished meals. Zero crew.' },
        { at: 0.42, icon: '🌱', name: 'Hydroponics Ring', lore: 'The plants have grown over the windows. They turn to watch you pass.' },
        { at: 0.64, icon: '⚛️', name: 'Reactor Core', lore: 'A blue glow and a hum you feel in your teeth.' },
        { at: 0.85, icon: '🔭', name: 'Observation Deck', lore: 'The whole planet below. For a moment it is peaceful.' },
        { at: 1, icon: '🚀', name: 'Escape Pod 7', lore: 'Launch sequence initiated. Kestrel fades into the dark.' }
      ],
      collectibles: [
        { at: 0.1, icon: '🔋', name: 'Power Cell', lore: '87% charged. Smells faintly of ozone.' },
        { at: 0.33, icon: '📼', name: 'Audio Log #4', lore: '"Day 41. The signal is getting into the walls."' },
        { at: 0.55, icon: '🧰', name: 'Plasma Cutter', lore: 'For cutting through doors. Only doors.' },
        { at: 0.76, icon: '🛸', name: 'Alien Artifact', lore: 'It hums in a key that does not exist.' },
        { at: 0.94, icon: '🪐', name: 'Star Chart', lore: 'Marks a route to somewhere nobody has been.' }
      ],
      encounters: [
        { icon: '🚨', text: 'Hull breach! Reach the next bulkhead before it seals!' },
        { icon: '🕷️', text: 'Something crawls through the vents above you.' },
        { icon: '🤖', text: 'A malfunctioning security drone locks on.' }
      ]
    },
    {
      id: 'verdania',
      name: 'Kingdom of Verdania',
      genre: 'Fantasy adventure',
      tagline: 'Rolling fields, ancient shrines and a castle in the clouds. A hero\'s journey.',
      km: 8,
      unlockKm: 20,
      theme: { bg1: '#7cc4f0', bg2: '#d8f3c6', ground: '#6fbf5a', path: '#efe2b8', pathEdge: '#8a6d3b', accent: '#2e7d32', text: '#1e2a16', fog: false },
      route: 'M60,540 C180,500 120,400 230,370 S420,430 470,330 S380,170 500,130 S700,210 720,320 S830,480 920,420 S960,200 880,90',
      landmarks: [
        { at: 0, icon: '🛖', name: 'Mossbrook Village', lore: 'An old woman hands you a wooden sword. "It\'s dangerous out there."' },
        { at: 0.15, icon: '🌲', name: 'Whispering Woods', lore: 'The trees remember every traveller. They hum your name.' },
        { at: 0.33, icon: '⛩️', name: 'Shrine of the Dawn', lore: 'A glowing pedestal. You feel a little stronger.' },
        { at: 0.5, icon: '🌉', name: 'Old Stone Bridge', lore: 'A grumpy troll asks for a toll. You pay with a riddle.' },
        { at: 0.68, icon: '🏔️', name: 'Frostcap Pass', lore: 'Snow up here, sun down there. The castle spires appear.' },
        { at: 0.85, icon: '🐉', name: 'Drake\'s Hollow', lore: 'A sleeping dragon. You tiptoe. Very, very carefully.' },
        { at: 1, icon: '🏰', name: 'Castle Aurelion', lore: 'The gates open. The kingdom is safe, for now.' }
      ],
      collectibles: [
        { at: 0.08, icon: '🗡️', name: 'Wooden Sword', lore: 'Better than nothing. Barely.' },
        { at: 0.25, icon: '❤️', name: 'Heart Vessel', lore: 'You feel healthier just holding it.' },
        { at: 0.42, icon: '🧭', name: 'Wayfinder Compass', lore: 'It points to whatever you need most.' },
        { at: 0.6, icon: '🛡️', name: 'Mirror Shield', lore: 'Polished enough to fix your hair.' },
        { at: 0.77, icon: '🪶', name: 'Glider Feather', lore: 'Lighter than air. Literally.' },
        { at: 0.93, icon: '💎', name: 'Triad Gem', lore: 'One of three. The others must be somewhere...' }
      ],
      encounters: [
        { icon: '🐗', text: 'A wild boar charges out of the brush!' },
        { icon: '🦇', text: 'A swarm of cave bats bursts out of the dark. Run!' },
        { icon: '👹', text: 'A goblin war party has spotted you!' }
      ]
    },
    {
      id: 'ember-wastes',
      name: 'The Ember Wastes',
      genre: 'Dark fantasy',
      tagline: 'A dying kingdom of ash and bonfires. Only the patient survive. You will be tested.',
      km: 12,
      unlockKm: 35,
      theme: { bg1: '#1a0d0a', bg2: '#4a1f12', ground: '#2b1610', path: '#d8a46a', pathEdge: '#120806', accent: '#ff7a1a', text: '#f6e3cc', fog: true },
      route: 'M80,80 C260,60 300,200 200,260 S70,420 200,520 S420,520 470,400 S440,200 560,160 S760,140 780,260 S640,420 760,500 S940,520 930,360 S880,120 940,60',
      landmarks: [
        { at: 0, icon: '🔥', name: 'First Bonfire', lore: 'You rest. Your progress is saved. The fire whispers "again".' },
        { at: 0.14, icon: '🏚️', name: 'Undying Hamlet', lore: 'Villagers stare at you through cracks. None of them blink.' },
        { at: 0.3, icon: '⚔️', name: 'Knight\'s Graveyard', lore: 'A thousand swords planted in the ash. One of them is still warm.' },
        { at: 0.46, icon: '🌋', name: 'Cinder Gorge', lore: 'The ground glows. Your boots smoke. Keep moving.' },
        { at: 0.62, icon: '🗼', name: 'The Hollow Spire', lore: 'Climb the stairs. Count them. The number changes each time.' },
        { at: 0.8, icon: '👑', name: 'Throne of the Ash King', lore: 'Empty. The crown lies on the floor, waiting.' },
        { at: 1, icon: '🌅', name: 'The Last Dawn', lore: 'For the first time in an age, the sun rises over the Wastes. You did it.' }
      ],
      collectibles: [
        { at: 0.07, icon: '🧪', name: 'Ember Flask', lore: 'Refills at every bonfire. Tastes like smoke.' },
        { at: 0.22, icon: '💀', name: 'Hollow Skull', lore: 'Someone carved a smile into it.' },
        { at: 0.38, icon: '🗡️', name: 'Ashen Greatsword', lore: 'Heavy enough to make your shoulders file a complaint.' },
        { at: 0.54, icon: '💍', name: 'Ring of Patience', lore: 'Slightly increases your will to keep walking.' },
        { at: 0.7, icon: '📖', name: 'Prayer of Embers', lore: 'Written in a language only the fire speaks.' },
        { at: 0.9, icon: '🕯️', name: 'Soul Lantern', lore: 'Holds the light of every traveller who fell here.' }
      ],
      encounters: [
        { icon: '🗡️', text: 'An invading phantom has entered your world!' },
        { icon: '🐺', text: 'A great grey wolf howls and gives chase!' },
        { icon: '🧌', text: 'The ground shakes. A colossal Ashen Warden awakens.' }
      ]
    }
  ];

  // ---------- Scenery painters (inline SVG strings, 1000x600) ----------
  function scenery(map, uid) {
    const gid = `${map.id}-${uid || 'x'}`;
    const t = map.theme;
    const r = rng(map.id.length * 7919 + map.km * 31);
    let s = `<defs>
      <linearGradient id="sky-${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/>
      </linearGradient>
      <radialGradient id="glow-${gid}"><stop offset="0" stop-color="${t.accent}" stop-opacity=".9"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1000" height="600" fill="url(#sky-${gid})"/>`;

    switch (map.id) {
      case 'pixel-plains': {
        for (let i = 0; i < 6; i++) {
          const x = r() * 900, y = 30 + r() * 120;
          s += `<g fill="#fff" opacity=".9"><rect x="${x}" y="${y}" width="80" height="20"/><rect x="${x + 16}" y="${y - 14}" width="44" height="16"/></g>`;
        }
        // Blocky hills
        for (let i = 0; i < 7; i++) {
          const x = i * 160 - 40, h = 100 + r() * 120;
          for (let k = 0; k < 5; k++) {
            const w = 200 - k * 40;
            s += `<rect x="${x + k * 20}" y="${600 - h * (0.4 + k * 0.15)}" width="${w}" height="${h}" fill="${k % 2 ? '#43a047' : '#66bb6a'}"/>`;
          }
        }
        s += `<rect y="560" width="1000" height="40" fill="#8d6e3f"/>`;
        for (let x = 0; x < 1000; x += 40) s += `<rect x="${x}" y="560" width="38" height="10" fill="#a1887f"/>`;
        break;
      }
      case 'ashfall-hollow': {
        s += `<ellipse cx="760" cy="120" rx="320" ry="110" fill="#5d6a6b" opacity=".7"/>`; // lake
        for (let i = 0; i < 26; i++) {
          const x = r() * 1000, y = 160 + r() * 440, h = 30 + r() * 60;
          s += `<g stroke="#1e1f1c" stroke-width="3" opacity="${0.4 + r() * 0.4}" fill="none"><path d="M${x},${y} l0,-${h} m0,${h * 0.4} l-${h * 0.3},-${h * 0.3} m${h * 0.3},${h * 0.1} l${h * 0.35},-${h * 0.4}"/></g>`;
        }
        for (let i = 0; i < 8; i++) {
          const x = 40 + r() * 900, y = 200 + r() * 350, w = 40 + r() * 50, h = 30 + r() * 50;
          s += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="#3a3c38" opacity=".55"/><polygon points="${x - 5},${y - h} ${x + w / 2},${y - h - 25} ${x + w + 5},${y - h}" fill="#33352f" opacity=".55"/>`;
        }
        // falling ash
        for (let i = 0; i < 70; i++) s += `<circle class="ash" cx="${r() * 1000}" cy="${r() * 600}" r="${1 + r() * 2}" fill="#e8e6df" opacity="${0.3 + r() * 0.5}" style="animation-delay:-${(r() * 12).toFixed(1)}s"/>`;
        break;
      }
      case 'mercy-city': {
        for (let i = 0; i < 40; i++) s += `<circle cx="${r() * 1000}" cy="${r() * 200}" r="${r() * 1.6}" fill="#fff" opacity=".6"/>`;
        s += `<circle cx="860" cy="70" r="36" fill="#f3e9c6" opacity=".9"/>`;
        // street grid blocks
        for (let gx = 0; gx < 10; gx++) for (let gy = 0; gy < 6; gy++) {
          const x = gx * 100 + 10, y = gy * 100 + 10, w = 70 + r() * 15, h = 70 + r() * 15;
          const lit = r();
          s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1c2742" stroke="#2f3c5e" />`;
          for (let wx = 0; wx < 4; wx++) for (let wy = 0; wy < 4; wy++) {
            if (r() < 0.35) s += `<rect x="${x + 8 + wx * 16}" y="${y + 8 + wy * 16}" width="8" height="8" fill="${lit < 0.15 ? '#e53935' : '#ffd36b'}" opacity="${0.4 + r() * 0.5}"/>`;
          }
        }
        for (let i = 0; i < 5; i++) s += `<circle cx="${r() * 1000}" cy="${r() * 600}" r="${60 + r() * 60}" fill="url(#glow-${gid})" opacity=".25"/>`;
        break;
      }
      case 'kestrel-station': {
        for (let i = 0; i < 160; i++) s += `<circle class="twinkle" cx="${r() * 1000}" cy="${r() * 600}" r="${r() * 1.8}" fill="#fff" opacity="${0.2 + r() * 0.8}" style="animation-delay:-${(r() * 4).toFixed(1)}s"/>`;
        s += `<circle cx="140" cy="520" r="190" fill="#1e4b7a" opacity=".55"/><circle cx="140" cy="520" r="190" fill="none" stroke="#62f0ff" stroke-opacity=".25" stroke-width="6"/>`;
        s += `<ellipse cx="500" cy="300" rx="430" ry="250" fill="none" stroke="#2b3966" stroke-width="40" opacity=".6"/>`;
        s += `<ellipse cx="500" cy="300" rx="140" ry="130" fill="#172042" stroke="#2b3966" stroke-width="14"/>`;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          s += `<line x1="${500 + Math.cos(ang) * 140}" y1="${300 + Math.sin(ang) * 130}" x2="${500 + Math.cos(ang) * 410}" y2="${300 + Math.sin(ang) * 235}" stroke="#2b3966" stroke-width="8" opacity=".6"/>`;
        }
        break;
      }
      case 'verdania': {
        s += `<circle cx="120" cy="90" r="50" fill="#fff6b0" opacity=".9"/>`;
        // mountains
        for (let i = 0; i < 6; i++) {
          const x = 300 + i * 120 + r() * 40, h = 180 + r() * 120;
          s += `<polygon points="${x - 140},330 ${x},${330 - h} ${x + 140},330" fill="#7c8fa6"/><polygon points="${x - 40},${330 - h + 70} ${x},${330 - h} ${x + 40},${330 - h + 70}" fill="#fff"/>`;
        }
        s += `<rect y="300" width="1000" height="300" fill="${t.ground}"/>`;
        s += `<path d="M0,420 C200,380 300,470 500,440 S800,360 1000,400 L1000,430 C800,390 700,480 500,470 S200,410 0,450 Z" fill="#4fa3d9" opacity=".8"/>`;
        for (let i = 0; i < 60; i++) {
          const x = r() * 1000, y = 300 + r() * 300;
          s += `<g><rect x="${x - 2}" y="${y}" width="4" height="12" fill="#5d4037"/><circle cx="${x}" cy="${y - 4}" r="${8 + r() * 6}" fill="${r() < 0.5 ? '#2e7d32' : '#388e3c'}"/></g>`;
        }
        // floating castle
        s += `<g transform="translate(830,60)" opacity=".95"><ellipse cx="40" cy="70" rx="70" ry="16" fill="#cfd8dc"/><rect x="10" y="20" width="60" height="50" fill="#eceff1"/><rect x="0" y="5" width="18" height="65" fill="#eceff1"/><rect x="62" y="5" width="18" height="65" fill="#eceff1"/><polygon points="0,5 9,-15 18,5" fill="#c62828"/><polygon points="62,5 71,-15 80,5" fill="#c62828"/></g>`;
        break;
      }
      case 'ember-wastes': {
        s += `<circle cx="500" cy="640" r="320" fill="url(#glow-${gid})" opacity=".45"/>`;
        for (let i = 0; i < 9; i++) {
          const x = r() * 1000, h = 120 + r() * 220, w = 14 + r() * 26;
          s += `<polygon points="${x - w},600 ${x},${600 - h} ${x + w},600" fill="#120806" opacity=".85"/>`;
        }
        for (let i = 0; i < 14; i++) {
          const x = r() * 1000, y = 100 + r() * 480;
          s += `<path d="M${x},${y} l${20 + r() * 30},${-5 + r() * 10} l${10 + r() * 30},${10 + r() * 20} l${20 + r() * 30},${-r() * 15}" stroke="#ff7a1a" stroke-width="2" fill="none" opacity="${0.4 + r() * 0.4}"/>`;
        }
        for (let i = 0; i < 60; i++) s += `<circle class="ember" cx="${r() * 1000}" cy="${r() * 600}" r="${1 + r() * 2}" fill="#ffb347" opacity="${0.4 + r() * 0.6}" style="animation-delay:-${(r() * 10).toFixed(1)}s"/>`;
        break;
      }
      default:
        if (window.WQ_SCENERY_EXTRA && window.WQ_SCENERY_EXTRA[map.id]) s += window.WQ_SCENERY_EXTRA[map.id](r, gid);
    }
    return s;
  }

  window.WQ_MAPS = MAPS;
  window.WQ_SCENERY = scenery;
})();
