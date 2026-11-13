/* Six more original WalkQuest worlds, with their own scenery painters. */
(function () {
  const NEW = [
    {
      id: 'neon-vale', name: 'Neon Vale', genre: 'Cyberpunk', km: 3, unlockKm: 5,
      tagline: 'Rain, holograms and corporate drones. Deliver the data shard across the city before midnight.',
      intro: 'In Neon Vale it is always raining and always night. You are a courier with a data shard taped inside your jacket and a client who pays triple if it reaches the Arcology rooftop before midnight. Every drone in the city wants to know what\'s on it.',
      theme: { bg1: '#0b0221', bg2: '#2b0a4a', ground: '#140528', path: '#ff3df2', pathEdge: '#2a0636', accent: '#00f0ff', text: '#f5e9ff', fog: false },
      route: 'M60,540 L200,540 L200,400 L360,400 L360,520 L520,520 L520,300 L300,300 L300,140 L560,140 L560,80 L760,80 L760,260 L940,260 L940,60',
      landmarks: [
        { at: 0, icon: '🏮', name: 'Night Market Gate', lore: 'Steam, noodles and stolen tech. A vendor slips you a free dumpling "for luck".' },
        { at: 0.2, icon: '🍜', name: 'Kaito\'s 24/7 Noodles', lore: 'The robot chef has served the same bowl since 2061. It is still excellent.' },
        { at: 0.4, icon: '🚝', name: 'Mag-Rail Overpass', lore: 'Trains scream overhead every 40 seconds, painting the street in blue light.' },
        { at: 0.6, icon: '🦾', name: 'Chrome Clinic', lore: 'Back-alley augment surgery. The doctor offers you new knees "at a discount".' },
        { at: 0.8, icon: '⛩️', name: 'Holo-Shrine', lore: 'A shrine made of light. People leave offerings of old phones.' },
        { at: 1, icon: '🏙️', name: 'Arcology Rooftop', lore: 'Midnight. The client takes the shard and the whole city skyline flickers. Job done.' }
      ],
      collectibles: [
        { at: 0.1, icon: '💾', name: 'Data Shard', lore: 'Encrypted. Warm. Possibly alive.' },
        { at: 0.32, icon: '🐈‍⬛', name: 'Synth Cat', lore: 'Purrs at 30 Hz. Needs charging, not feeding.' },
        { at: 0.52, icon: '🗡️', name: 'Neon Katana', lore: 'Mostly for show. The blade is a light tube.' },
        { at: 0.72, icon: '💳', name: 'Untraceable Credchip', lore: 'Balance: enough. Owner: nobody.' },
        { at: 0.92, icon: '🕶️', name: 'HUD Shades', lore: 'Shows your step count in neon. Very you.' }
      ],
      encounters: [
        { icon: '🛸', text: 'A corporate security drone has scanned your face. Lose it in the crowd!' },
        { icon: '🏍️', text: 'A biker gang wants the shard. Floor it!' },
        { icon: '📡', text: 'A hacker is tracing your location. Keep moving to break the signal!' }
      ],
      sights: [
        ['🌧️', 'Rain falls in pink and blue streaks, lit by a hundred signs.'],
        ['📺', 'A giant billboard advertises "New Lungs, Same Day Delivery".'],
        ['🤖', 'A street-cleaning bot apologises to a puddle.'],
        ['🎰', 'A pachinko parlour roars with noise and light.'],
        ['🐉', 'A holographic dragon coils around a skyscraper, advertising soda.'],
        ['🛵', 'Delivery scooters zip past, all carrying the same pizza brand.'],
        ['👘', 'An old woman feeds pigeons. Half of them are drones.'],
        ['🔌', 'Tangled cables hang over the street like jungle vines.'],
        ['🎤', 'A busker plays a synth guitar. A crowd of three robots applauds.']
      ]
    },
    {
      id: 'saltwind-isles', name: 'Saltwind Isles', genre: 'Pirate adventure', km: 5, unlockKm: 8,
      tagline: 'Island-hop across a pirate archipelago, following an old map to buried treasure.',
      intro: 'A dying sailor in a harbour tavern pressed a map into your hand and whispered "the tree that isn\'t". Now half the pirates in the Saltwind Isles are looking for you. Rowboats, rope bridges and a lot of sand stand between you and the treasure.',
      theme: { bg1: '#1e88c7', bg2: '#5fd3e8', ground: '#f3d98b', path: '#fff3c4', pathEdge: '#8a5a2b', accent: '#ffb300', text: '#10283a', fog: false },
      route: 'M80,500 C180,560 300,520 330,430 S260,280 380,230 S560,300 620,220 S560,80 700,70 S880,140 860,260 S760,420 860,500 S940,540 960,530',
      landmarks: [
        { at: 0, icon: '⚓', name: 'Rumhook Harbor', lore: 'Ships creak, gulls scream, and someone is definitely following you.' },
        { at: 0.18, icon: '🦜', name: 'Parrot Cliffs', lore: 'Hundreds of parrots repeat the same word: "Treasure." It\'s getting on your nerves.' },
        { at: 0.36, icon: '🚢', name: 'Shipwreck Lagoon', lore: 'The wreck of the Gilded Gull lies on its side, still full of barrels.' },
        { at: 0.55, icon: '💀', name: 'Skull Rock', lore: 'A rock shaped like a skull. Of course it is. They always are.' },
        { at: 0.75, icon: '🕯️', name: 'Smugglers\' Caves', lore: 'Lanterns, crates and a ledger listing every bribe in the islands.' },
        { at: 1, icon: '🌴', name: 'The Tree That Isn\'t', lore: 'A painted wooden palm tree. You dig beneath it. Gold. So much gold.' }
      ],
      collectibles: [
        { at: 0.08, icon: '🗺️', name: 'Half a Treasure Map', lore: 'The other half is probably in a shark.' },
        { at: 0.27, icon: '🧭', name: 'Brass Compass', lore: 'Points north. Mostly.' },
        { at: 0.46, icon: '🏴‍☠️', name: 'Tattered Flag', lore: 'Captain Marrow\'s colours. She wants it back.' },
        { at: 0.65, icon: '🐚', name: 'Singing Conch', lore: 'Hold it to your ear and it hums sea shanties.' },
        { at: 0.85, icon: '🪙', name: 'Doubloon', lore: 'Bite it. Yep, real gold.' },
        { at: 0.95, icon: '🦴', name: 'Peg Leg', lore: 'Someone\'s spare. Surprisingly comfortable.' }
      ],
      encounters: [
        { icon: '⛵', text: 'A navy cutter has spotted you. Run for the treeline!' },
        { icon: '🐙', text: 'Tentacles burst out of the surf beside the path!' },
        { icon: '🏴‍☠️', text: 'Captain Marrow\'s crew is on your trail, cutlasses drawn!' }
      ],
      sights: [
        ['🌊', 'Waves crash against the rocks and spray salt in your face.'],
        ['🦀', 'A crab scuttles sideways along the path, keeping pace with you.'],
        ['🌉', 'A rope bridge sways over a gap. You don\'t look down. You look down.'],
        ['🐢', 'A sea turtle lays eggs on the beach. You give her space.'],
        ['🍹', 'A beach shack sells coconut drinks. The sign says "No pirates". It is full of pirates.'],
        ['🐬', 'Dolphins race alongside the shoreline.'],
        ['🔭', 'A broken spyglass on a rock. Through it you see your destination, very small.'],
        ['🌋', 'A distant volcano puffs a polite little smoke ring.'],
        ['🪢', 'A hanging net full of coconuts. A trap, obviously. You step around it.'],
        ['🌅', 'The sun sinks into the sea and turns everything orange.']
      ]
    },
    {
      id: 'hollowmere-manor', name: 'Hollowmere Manor', genre: 'Gothic horror', km: 4.5, unlockKm: 15,
      tagline: 'A vampire lord\'s estate on a stormy night. Cross the grounds and ring the bell before he wakes.',
      intro: 'Hollowmere Manor has been dark for a century. Tonight its windows are lit. Legend says that whoever rings the belfry bell before the master wakes breaks his curse. Lightning flashes. A carriage with no horses is waiting for you at the gate.',
      theme: { bg1: '#120a1f', bg2: '#3a2350', ground: '#1c1426', path: '#c8b8d8', pathEdge: '#0a0610', accent: '#b0103a', text: '#f2e8ff', fog: true, fogColor: '#2a1d3a', fogOpacity: 0.7 },
      route: 'M500,560 C300,560 160,500 160,400 S320,300 480,330 S760,420 820,330 S700,180 520,200 S240,200 260,110 S520,40 700,60 S880,80 900,60',
      landmarks: [
        { at: 0, icon: '⛓️', name: 'The Iron Gates', lore: 'They creak open on their own. A raven announces your name.' },
        { at: 0.16, icon: '🌿', name: 'The Hedge Maze', lore: 'The hedges shift when you aren\'t looking. You follow the moonlight.' },
        { at: 0.33, icon: '🖼️', name: 'Portrait Gallery', lore: 'Twelve portraits of the same man, painted three hundred years apart. He hasn\'t aged.' },
        { at: 0.5, icon: '🍷', name: 'The Banquet Hall', lore: 'A feast laid for forty. Every goblet is full of something red.' },
        { at: 0.68, icon: '⚰️', name: 'Family Crypt', lore: 'One coffin lid is slightly open. You walk faster.' },
        { at: 0.84, icon: '📚', name: 'Forbidden Library', lore: 'A book falls open to a page about you. It is dated tomorrow.' },
        { at: 1, icon: '🔔', name: 'The Belfry', lore: 'You ring the bell. The storm stops. Somewhere below, a long sigh of relief.' }
      ],
      collectibles: [
        { at: 0.07, icon: '🧄', name: 'String of Garlic', lore: 'A classic for a reason.' },
        { at: 0.24, icon: '🪞', name: 'Hand Mirror', lore: 'Shows everything in the room except the man behind you.' },
        { at: 0.42, icon: '🕯️', name: 'Silver Candelabra', lore: 'Heavy enough to defend yourself with.' },
        { at: 0.6, icon: '🌹', name: 'Black Rose', lore: 'Never wilts. Smells like old perfume.' },
        { at: 0.77, icon: '✝️', name: 'Silver Sigil', lore: 'Glows faintly when danger is near. It is glowing.' },
        { at: 0.93, icon: '🗝️', name: 'Belfry Key', lore: 'Cold as ice, heavy as guilt.' }
      ],
      encounters: [
        { icon: '🦇', text: 'A cloud of bats pours out of the chimney!' },
        { icon: '👻', text: 'A weeping ghost glides through the wall toward you!' },
        { icon: '🧛', text: 'Footsteps on the stairs above. The master is awake. RUN.' }
      ],
      sights: [
        ['⚡', 'Lightning reveals a figure on the balcony. Next flash: it\'s gone.'],
        ['🪦', 'A graveyard where every headstone has the same date of death.'],
        ['🐈‍⬛', 'A black cat crosses your path. Then crosses it again. Then again.'],
        ['🎹', 'A piano plays by itself in an empty room. It plays well.'],
        ['🕸️', 'Cobwebs as thick as curtains hang across the corridor.'],
        ['🕰️', 'A grandfather clock strikes thirteen.'],
        ['🛏️', 'A guest bedroom, freshly made, with your name on the pillow card.'],
        ['🐺', 'A wolf howls outside, then another, then a hundred.'],
        ['🩸', 'A trail of red wax drops leads up the stairs.']
      ]
    },
    {
      id: 'sunscorch-tombs', name: 'Sunscorch Tombs', genre: 'Desert tomb raid', km: 7, unlockKm: 25,
      tagline: 'Cross a sea of dunes to the hidden tomb of the Sun Queen. Mind the traps.',
      intro: 'Every explorer who went looking for the Sun Queen\'s tomb came back rich or didn\'t come back at all. You have a camel-hair hat, a rope, and a guide who left at the first sandstorm. The dunes stretch to the horizon, hiding the entrance.',
      theme: { bg1: '#f08a24', bg2: '#ffd98a', ground: '#e8b45f', path: '#fff1c9', pathEdge: '#7a4a17', accent: '#c2410c', text: '#3a1f05', fog: false },
      route: 'M60,300 C180,200 260,420 380,360 S520,140 640,220 S700,480 820,440 S940,200 960,120',
      landmarks: [
        { at: 0, icon: '🐪', name: 'Caravan Camp', lore: 'The last water for a hundred kilometres. You fill every bottle you have.' },
        { at: 0.16, icon: '🗿', name: 'The Sunken Obelisk', lore: 'Only its tip pokes out of the sand, covered in warnings you can\'t read.' },
        { at: 0.33, icon: '🪲', name: 'Scarab Canyon', lore: 'The canyon walls are carved with millions of beetles. Some of the carvings move.' },
        { at: 0.5, icon: '🏜️', name: 'Mirage Oasis', lore: 'Palm trees, a pool, music. You reach out and it dissolves. Next time.' },
        { at: 0.67, icon: '🔺', name: 'The Weeping Pyramid', lore: 'Sand pours from its peak like an hourglass. The entrance is open.' },
        { at: 0.84, icon: '🪞', name: 'Hall of Mirrors', lore: 'Polished bronze plates bounce sunlight deep into the tomb. Follow the light.' },
        { at: 1, icon: '👑', name: 'Sun Queen\'s Chamber', lore: 'The golden sarcophagus opens. Inside: a note. "Thank you for visiting. Please walk back."' }
      ],
      collectibles: [
        { at: 0.08, icon: '🏺', name: 'Canopic Jar', lore: 'Sealed. Rattles. Don\'t open it.' },
        { at: 0.24, icon: '🪲', name: 'Golden Scarab', lore: 'Its legs twitch when you aren\'t looking.' },
        { at: 0.41, icon: '📜', name: 'Papyrus of Routes', lore: 'Directions to the tomb. And a recipe for bread.' },
        { at: 0.58, icon: '🔱', name: 'Sun Spear', lore: 'Catches the light like a lighthouse.' },
        { at: 0.75, icon: '🐍', name: 'Cobra Amulet', lore: 'Hisses at liars. It hissed at you once. Fair.' },
        { at: 0.92, icon: '☀️', name: 'Sunstone', lore: 'Warm in your hand, even at night.' }
      ],
      encounters: [
        { icon: '🌪️', text: 'A sandstorm rolls in like a wall. Find shelter fast!' },
        { icon: '🦂', text: 'Giant scorpions boil up out of the sand!' },
        { icon: '🧟', text: 'The mummified guards have woken up. They are slow, but they never stop.' }
      ],
      sights: [
        ['☀️', 'The sun beats down. Your shadow is the only shade for miles.'],
        ['🦴', 'A huge skeleton half buried in a dune. Something with more ribs than usual.'],
        ['🌵', 'A lone cactus wearing an explorer\'s hat. Someone has a sense of humour.'],
        ['🦅', 'A vulture circles overhead. You give it a stern look.'],
        ['🏕️', 'An abandoned camp. The journal ends mid-sentence: "We found the door. It was"'],
        ['🔥', 'The heat makes the horizon wobble like water.'],
        ['🐫', 'A wild camel watches you with total contempt.'],
        ['⏳', 'The sand under your feet starts to slide. You hop onto solid rock just in time.'],
        ['🌙', 'Night falls fast. Stars, more than you\'ve ever seen.'],
        ['🔦', 'Torches on the tomb walls light up one by one as you pass.']
      ]
    },
    {
      id: 'frostfang-peaks', name: 'Frostfang Peaks', genre: 'Nordic saga', km: 10, unlockKm: 45,
      tagline: 'A saga across frozen mountains, past rune stones and giants, to the gate of the hall in the sky.',
      intro: 'The skalds tell of a warrior who walked from the fjord to the sky. The winter is endless, the giants are restless, and the gate at the summit only opens for someone who arrives on foot. Grab your cloak. It\'s a long saga.',
      theme: { bg1: '#1b2a4a', bg2: '#9cc7e8', ground: '#e8f1fa', path: '#ffffff', pathEdge: '#4a6688', accent: '#4fd1c5', text: '#0e1a2e', fog: false },
      route: 'M80,560 C300,540 420,520 360,460 S120,420 200,360 S560,360 600,300 S300,250 360,200 S720,200 760,150 S520,100 600,70 S880,60 920,50',
      landmarks: [
        { at: 0, icon: '🛖', name: 'Fjordhold Longhouse', lore: 'Fire, mead and a skald who promises to sing about you. Badly.' },
        { at: 0.14, icon: '🪨', name: 'The Rune Stones', lore: 'Standing stones carved with the names of travellers. There\'s room for one more.' },
        { at: 0.28, icon: '🧊', name: 'Frozen Waterfall', lore: 'A waterfall stopped mid-fall. You can see fish frozen inside it.' },
        { at: 0.43, icon: '🌉', name: 'Giant\'s Bridge', lore: 'A bridge built from one enormous sword. Its owner wants it back eventually.' },
        { at: 0.58, icon: '🐺', name: 'Wolfmother\'s Den', lore: 'A huge white wolf watches you pass, decides you\'re not worth it, and yawns.' },
        { at: 0.73, icon: '⚒️', name: 'Dwarven Forge', lore: 'Hammers ring inside the mountain. A smith sharpens your walking stick for free.' },
        { at: 0.87, icon: '🌌', name: 'Aurora Summit', lore: 'The sky ripples green and purple. It looks close enough to touch.' },
        { at: 1, icon: '🏛️', name: 'Skyhall Gate', lore: 'The gate opens. Warm light, loud laughter, a seat at the table. Your saga is written.' }
      ],
      collectibles: [
        { at: 0.06, icon: '🪓', name: 'Bearded Axe', lore: 'For chopping firewood. And trolls.' },
        { at: 0.2, icon: '🍯', name: 'Mead Horn', lore: 'Empty, unfortunately.' },
        { at: 0.36, icon: '🧶', name: 'Fur Cloak', lore: 'Smells like bear. Very warm.' },
        { at: 0.5, icon: '🛡️', name: 'Round Shield', lore: 'Painted with a dragon that looks a bit like a duck.' },
        { at: 0.65, icon: 'ᛟ', name: 'Rune of Endurance', lore: 'Carved into bone. Your legs feel fresher.' },
        { at: 0.8, icon: '🔨', name: 'Storm Hammer', lore: 'It sparks when you swing it. You stop swinging it.' },
        { at: 0.94, icon: '🪶', name: 'Raven Feather', lore: 'One of the two ravens that see everything. It saw you.' }
      ],
      encounters: [
        { icon: '🏔️', text: 'Avalanche! Snow thunders down the slope above you!' },
        { icon: '🧌', text: 'A frost troll steps out of a cave and sniffs the air.' },
        { icon: '🐺', text: 'A pack of grey wolves breaks from the treeline!' }
      ],
      sights: [
        ['❄️', 'Snowflakes as big as coins drift down silently.'],
        ['🦌', 'A herd of reindeer crosses the path, steaming in the cold.'],
        ['⛵', 'Far below, a longship rows out of the fjord.'],
        ['🔥', 'A beacon fire burns on a distant peak. Someone is signalling.'],
        ['🐻', 'Enormous bear tracks in the snow. Very fresh.'],
        ['🎺', 'A war horn echoes off the mountains. It\'s answered by another.'],
        ['🌲', 'Pine trees bent under heavy snow, like old people bowing.'],
        ['🧝', 'A shimmering figure watches you from an ice cave, then vanishes.'],
        ['🌨️', 'A blizzard hides everything. You follow the cairns.'],
        ['🦅', 'An eagle rides the wind beside you, level with your shoulder.'],
        ['🗿', 'A giant\'s face carved into the cliffside. Its eyes follow you.']
      ]
    },
    {
      id: 'abyssal-deep', name: 'The Abyssal Deep', genre: 'Deep-sea mystery', km: 15, unlockKm: 60,
      tagline: 'Descend through sunken ruins to the bottom of the ocean, where something old is waiting.',
      intro: 'A pressure-suit, a lamp and a signal: three notes, repeating, from 11 kilometres down. Nobody who went to find the source came back up. The water gets darker with every step. Bring patience. The Deep is not in a hurry.',
      theme: { bg1: '#0a4d6e', bg2: '#01060f', ground: '#021422', path: '#7af7d0', pathEdge: '#012030', accent: '#2ef2c8', text: '#d9fff5', fog: true, fogColor: '#000510', fogOpacity: 0.72 },
      route: 'M80,60 C300,40 600,60 880,80 S920,220 700,240 S200,200 140,300 S300,420 600,400 S860,380 840,470 S500,540 300,520 S460,450 520,470',
      landmarks: [
        { at: 0, icon: '🛟', name: 'Bathysphere Dock', lore: 'The cable groans as you descend. The surface becomes a small blue circle, then nothing.' },
        { at: 0.12, icon: '🌿', name: 'Kelp Cathedral', lore: 'Kelp grows in tall arches, like a church. Fish move through it like a congregation.' },
        { at: 0.25, icon: '🚢', name: 'Wreck of the Meridian', lore: 'A passenger liner, perfectly preserved. The dining room tables are still set.' },
        { at: 0.38, icon: '📚', name: 'The Drowned Library', lore: 'Stone shelves full of books that somehow haven\'t got wet. The pages are blank until you look away.' },
        { at: 0.52, icon: '🪸', name: 'Coral City', lore: 'Streets, towers and bridges built from living coral. Someone designed this.' },
        { at: 0.66, icon: '✨', name: 'The Glowing Trench', lore: 'Everything glows here: fish, plants, the sand. It\'s beautiful and a little alive.' },
        { at: 0.8, icon: '🔔', name: 'The Drowned Bell', lore: 'A bell the size of a house. It rings once, slowly, as you pass. Three notes.' },
        { at: 0.92, icon: '🌀', name: 'The Maw', lore: 'A whirlpool on the sea floor, spinning the wrong way.' },
        { at: 1, icon: '👁️', name: 'The Eye of the Deep', lore: 'An eye opens, bigger than a stadium. It looks at you, kindly. The signal stops. You go home.' }
      ],
      collectibles: [
        { at: 0.06, icon: '🔦', name: 'Pressure Lamp', lore: 'Rated to 12,000 m. Fingers crossed.' },
        { at: 0.18, icon: '🐚', name: 'Spiral Shell', lore: 'It\'s mathematically perfect. Unsettlingly so.' },
        { at: 0.31, icon: '⌚', name: 'Captain\'s Pocket Watch', lore: 'Stopped at 2:14. Every watch on the Meridian did.' },
        { at: 0.45, icon: '📖', name: 'Waterproof Codex', lore: 'Written in a language of circles.' },
        { at: 0.59, icon: '🦪', name: 'Black Pearl', lore: 'Reflects a sky you\'ve never seen.' },
        { at: 0.73, icon: '🪼', name: 'Jarred Jellyfish', lore: 'Your new nightlight.' },
        { at: 0.86, icon: '🔱', name: 'Coral Trident', lore: 'Grew in the shape of a weapon. Coral doesn\'t do that.' },
        { at: 0.96, icon: '🫧', name: 'Bottled Signal', lore: 'Three notes, captured in a bubble that never pops.' }
      ],
      encounters: [
        { icon: '🐡', text: 'An anglerfish\'s lure dangles in front of you. Don\'t follow the light!' },
        { icon: '🦑', text: 'A giant squid unfurls from the darkness!' },
        { icon: '🐋', text: 'A shadow passes overhead, longer than a ship. Swim!' }
      ],
      sights: [
        ['🫧', 'A curtain of bubbles rises past you towards a surface you can no longer see.'],
        ['🐠', 'A school of fish turns all at once, like a single silver animal.'],
        ['🐢', 'An ancient turtle drifts by, barnacled and slow.'],
        ['🦈', 'A shark circles once, decides you\'re too crunchy, and leaves.'],
        ['🏛️', 'Columns of a sunken temple lean in the sand.'],
        ['🪼', 'Jellyfish pulse in slow rhythm, glowing pink.'],
        ['🔊', 'The three-note signal, louder now. You feel it in your chest.'],
        ['🦀', 'A crab the size of a car is very busy and ignores you completely.'],
        ['🌋', 'A hydrothermal vent blasts black smoke and heat.'],
        ['🗿', 'A statue of a diver in an old brass suit. The plaque has your name on it.'],
        ['💡', 'Your lamp flickers. In the dark between flickers, something is very close.'],
        ['🌑', 'Total darkness except your lamp. You walk by faith.']
      ]
    }
  ];

  // ---------- scenery painters for the new maps ----------
  const P = {
    'neon-vale'(r, gid) {
      let s = '';
      for (let i = 0; i < 26; i++) {
        const x = i * 40 - 10 + r() * 10, w = 30 + r() * 30, h = 120 + r() * 380;
        s += `<rect x="${x}" y="${600 - h}" width="${w}" height="${h}" fill="#12052a" stroke="#2c0e52"/>`;
        for (let k = 0; k < 10; k++) if (r() < 0.5) s += `<rect x="${x + 4 + r() * (w - 10)}" y="${600 - h + 10 + r() * (h - 20)}" width="5" height="3" fill="${r() < 0.5 ? '#ff3df2' : '#00f0ff'}" opacity="${0.4 + r() * 0.6}"/>`;
        if (r() < 0.3) s += `<rect x="${x + 3}" y="${600 - h + 15}" width="${w - 6}" height="14" rx="3" fill="none" stroke="${r() < 0.5 ? '#ff3df2' : '#ffe600'}" stroke-width="2"/>`;
      }
      for (let i = 0; i < 90; i++) { const x = r() * 1000, y = r() * 600; s += `<line class="rain" x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 18}" stroke="#7fdcff" stroke-opacity=".35" style="animation-delay:-${(r() * 2).toFixed(2)}s"/>`; }
      return s;
    },
    'saltwind-isles'(r, gid) {
      let s = '';
      for (let i = 0; i < 40; i++) { const x = r() * 1000, y = r() * 600; s += `<path d="M${x},${y} q8,-6 16,0 t16,0" stroke="#fff" stroke-opacity=".35" fill="none" stroke-width="2"/>`; }
      const isl = [[260, 470, 150, 90], [470, 260, 140, 80], [690, 110, 130, 70], [830, 340, 110, 140], [900, 510, 90, 50]];
      for (const [x, y, rx, ry] of isl) {
        s += `<ellipse cx="${x}" cy="${y}" rx="${rx + 18}" ry="${ry + 14}" fill="#7fe3e0" opacity=".6"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f3d98b"/><ellipse cx="${x + 10}" cy="${y - 8}" rx="${rx * 0.6}" ry="${ry * 0.55}" fill="#4caf50"/>`;
        for (let k = 0; k < 3; k++) { const px = x - rx * 0.4 + r() * rx * 0.8, py = y - ry * 0.3 + r() * ry * 0.3; s += `<line x1="${px}" y1="${py}" x2="${px + 4}" y2="${py - 26}" stroke="#7a4a17" stroke-width="3"/><path d="M${px + 4},${py - 26} q-14,0 -18,8 M${px + 4},${py - 26} q14,0 18,8 M${px + 4},${py - 26} q-6,-12 -16,-12 M${px + 4},${py - 26} q6,-12 16,-12" stroke="#2e7d32" stroke-width="4" fill="none"/>`; }
      }
      s += `<g transform="translate(560,470)"><path d="M0,0 l70,0 l-10,16 l-50,0 z" fill="#5d3a1a"/><line x1="35" y1="0" x2="35" y2="-50" stroke="#3e2723" stroke-width="3"/><path d="M37,-48 l26,20 l-26,4 z" fill="#f5f5f5"/><rect x="28" y="-56" width="12" height="7" fill="#111"/></g>`;
      return s;
    },
    'hollowmere-manor'(r, gid) {
      let s = `<circle cx="830" cy="110" r="70" fill="#f3e9d2" opacity=".9"/><circle cx="805" cy="95" r="12" fill="#d8cdb2" opacity=".6"/>`;
      s += `<g fill="#0b0612"><rect x="330" y="150" width="340" height="200"/><polygon points="320,150 500,40 680,150"/><rect x="300" y="90" width="50" height="260"/><polygon points="295,90 325,30 355,90"/><rect x="650" y="90" width="50" height="260"/><polygon points="645,90 675,30 705,90"/></g>`;
      for (let i = 0; i < 14; i++) s += `<rect x="${350 + (i % 7) * 45}" y="${180 + Math.floor(i / 7) * 70}" width="16" height="28" fill="${r() < 0.4 ? '#ffcc66' : '#1d1028'}" opacity=".85"/>`;
      for (let i = 0; i < 30; i++) { const x = r() * 1000, y = 380 + r() * 220; s += `<path d="M${x},${y} v-22 a10,10 0 0 1 20,0 v22 z" fill="#2c2238" opacity=".8"/>`; }
      for (let i = 0; i < 10; i++) { const x = r() * 1000, y = 40 + r() * 200; s += `<path class="bat" d="M${x},${y} q6,-8 12,0 q6,-8 12,0 q-6,4 -12,2 q-6,2 -12,-2" fill="#000" style="animation-delay:-${(r() * 3).toFixed(1)}s"/>`; }
      return s;
    },
    'sunscorch-tombs'(r, gid) {
      let s = `<circle cx="160" cy="110" r="70" fill="#fff4c2" opacity=".95"/>`;
      s += `<polygon points="560,330 700,110 840,330" fill="#d18b3a"/><polygon points="700,110 840,330 760,330" fill="#a8672a"/><polygon points="360,330 450,190 540,330" fill="#d9974a"/><polygon points="450,190 540,330 490,330" fill="#b5732f"/>`;
      for (let i = 0; i < 6; i++) { const y = 300 + i * 55; s += `<path d="M0,${y} C200,${y - 40 - r() * 30} 400,${y + 20} 600,${y - 20} S900,${y + 30} 1000,${y - 10} L1000,600 L0,600 Z" fill="${['#f0c070', '#e8b45f', '#dea552', '#d49745', '#c98a3a', '#bf7f30'][i]}"/>`; }
      for (let i = 0; i < 8; i++) { const x = r() * 1000, y = 380 + r() * 200; s += `<g><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 30}" stroke="#2f6b2f" stroke-width="7" stroke-linecap="round"/><path d="M${x},${y - 16} h-10 v-10 M${x},${y - 20} h10 v-8" stroke="#2f6b2f" stroke-width="5" fill="none" stroke-linecap="round"/></g>`; }
      return s;
    },
    'frostfang-peaks'(r, gid) {
      let s = `<path d="M0,120 C200,60 400,180 600,90 S900,60 1000,120 L1000,170 C800,120 650,220 450,150 S150,140 0,180 Z" fill="#4fd1c5" opacity=".35" class="aurora"/><path d="M0,90 C250,30 450,140 650,70 S900,40 1000,80 L1000,110 C850,80 700,170 500,110 S150,100 0,130 Z" fill="#9f7aea" opacity=".25" class="aurora"/>`;
      for (let i = 0; i < 7; i++) { const x = i * 170 + r() * 40, h = 220 + r() * 220; s += `<polygon points="${x - 180},600 ${x},${600 - h} ${x + 180},600" fill="#5b7aa3"/><polygon points="${x - 55},${600 - h + 75} ${x},${600 - h} ${x + 55},${600 - h + 75} ${x + 25},${600 - h + 60} ${x},${600 - h + 85} ${x - 20},${600 - h + 62}" fill="#f4f9ff"/>`; }
      for (let i = 0; i < 30; i++) { const x = r() * 1000, y = 380 + r() * 220; s += `<polygon points="${x - 10},${y} ${x},${y - 30} ${x + 10},${y}" fill="#1f4d3a"/><polygon points="${x - 7},${y - 12} ${x},${y - 30} ${x + 7},${y - 12}" fill="#fff" opacity=".7"/>`; }
      for (let i = 0; i < 70; i++) s += `<circle class="ash" cx="${r() * 1000}" cy="${r() * 600}" r="${1 + r() * 2.2}" fill="#fff" opacity="${0.5 + r() * 0.5}" style="animation-delay:-${(r() * 12).toFixed(1)}s"/>`;
      return s;
    },
    'abyssal-deep'(r, gid) {
      let s = '';
      for (let i = 0; i < 6; i++) { const x = 100 + i * 160 + r() * 60; s += `<polygon points="${x},0 ${x + 40},0 ${x + 140},420 ${x + 60},420" fill="#7ad7ff" opacity=".06"/>`; }
      for (let i = 0; i < 24; i++) { const x = r() * 1000, h = 60 + r() * 160; s += `<path d="M${x},600 q${-15 + r() * 30},${-h / 2} ${-10 + r() * 20},${-h}" stroke="#0f5a46" stroke-width="5" fill="none" opacity=".7"/>`; }
      for (let i = 0; i < 5; i++) { const x = 100 + r() * 800, y = 380 + r() * 180; s += `<rect x="${x}" y="${y - 70}" width="16" height="70" fill="#0d2a3a"/><rect x="${x - 6}" y="${y - 76}" width="28" height="8" fill="#0d2a3a"/>`; }
      for (let i = 0; i < 60; i++) s += `<circle cx="${r() * 1000}" cy="${r() * 600}" r="${1 + r() * 2}" fill="#2ef2c8" opacity="${0.2 + r() * 0.7}" class="twinkle" style="animation-delay:-${(r() * 4).toFixed(1)}s"/>`;
      for (let i = 0; i < 40; i++) s += `<circle class="ember" cx="${r() * 1000}" cy="${r() * 600}" r="${1.5 + r() * 3}" fill="none" stroke="#bff" stroke-opacity=".5" style="animation-delay:-${(r() * 10).toFixed(1)}s"/>`;
      return s;
    }
  };

  window.WQ_MAPS.push(...NEW);
  window.WQ_SCENERY_EXTRA = P;
})();
