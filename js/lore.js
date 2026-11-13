/* Extra lore for the original six maps: an intro and "sights" you pass between landmarks. */
(function () {
  const L = {
    'pixel-plains': {
      intro: 'The Pixel Plains run on a 60 Hz heartbeat. Every hill is made of perfect squares and every cloud loops back around the screen. A gentle warm-up, but keep your eyes open for hidden blocks.',
      sights: [
        ['☁️', 'A cloud with a smiling face drifts past at exactly the same speed as you.'],
        ['🌼', 'Square flowers bob left and right in two-frame animation.'],
        ['🟩', 'A green pipe sticks out of the ground. Something inside it is humming a tune.'],
        ['❓', 'A floating block with a question mark. You punch it. Nothing. Maybe next time.'],
        ['🐌', 'A pixel snail crosses the path. It takes three frames per step.'],
        ['🌈', 'A rainbow, rendered in a palette of exactly 6 colours.'],
        ['🔊', 'A distant chiptune drifts on the wind, then loops.'],
        ['🎆', 'Fireworks pop in the distance. Someone just finished a level.']
      ]
    },
    'ashfall-hollow': {
      intro: 'You got a letter from someone who could not have written it. It asked you to come to Ashfall Hollow, a lakeside town that doesn\'t appear on any recent map. The fog is so thick you can only see a few metres around you. Keep walking. Don\'t look back for too long.',
      sights: [
        ['🪧', 'A welcome sign, letters half eaten by rust: "W LC ME TO  SHF LL".'],
        ['🚗', 'An abandoned car with the engine still warm. The radio is tuned to static.'],
        ['🐾', 'Footprints in the ash, going the same way as you. They are smaller than yours.'],
        ['📮', 'A mailbox overflowing with letters, all addressed to you.'],
        ['🛝', 'An empty playground. One swing is moving.'],
        ['🔔', 'A bell rings somewhere across the lake. You count. It stops at seven.'],
        ['🩸', 'A long rusty smear on a wall, as if something was dragged here.'],
        ['🕳️', 'The road ends at a hole that goes down further than your flashlight reaches. You take the detour.'],
        ['🎶', 'A music box plays from an open window. The window is on the third floor of a two-storey house.'],
        ['🌊', 'Lake water laps at the road. For a second you see a figure standing on the surface.']
      ]
    },
    'mercy-city': {
      intro: 'Mercy City was a company town, built around Halcyon Biotech. Then something leaked. The army sealed the bridges and the last helicopter leaves from the downtown rooftop at dawn. You have one map, half a radio, and very good walking shoes.',
      sights: [
        ['🚧', 'Overturned barricades. "QUARANTINE ZONE" tape flutters in the wind.'],
        ['📰', 'A newspaper blows past: "HALCYON SAYS: NOTHING TO WORRY ABOUT".'],
        ['🏪', 'A corner shop with its shutters half down. The cash register is open and empty.'],
        ['🚑', 'An ambulance with all its doors open. The stretcher is gone.'],
        ['📢', 'A loudspeaker repeats: "Stay indoors. Help is on the way." It has been saying it for days.'],
        ['🩹', 'Bloody bandages in a trail leading into an alley. You do not follow it.'],
        ['🚦', 'Traffic lights still change for streets with no traffic.'],
        ['🐀', 'Rats pour out of a drain, all running the same direction as you. That\'s a good sign. Probably.'],
        ['🖥️', 'A TV in a shop window shows the Halcyon logo, then flickers to a test pattern.'],
        ['🌅', 'The sky starts going pink behind the skyscrapers. Dawn is close.']
      ]
    },
    'kestrel-station': {
      intro: 'Research Station Kestrel stopped transmitting 41 days ago. You are the maintenance engineer they sent to "check the antenna". Life support is running on backup and the only escape pod still working is on the other side of the ring.',
      sights: [
        ['💡', 'Corridor lights switch on one by one as you pass, then off behind you.'],
        ['🧊', 'Frost on the inside of a viewport. The heating in this section has failed.'],
        ['📋', 'A clipboard floats in a low-gravity section: "Inventory: 12 crew. 11 crew. 12 crew?"'],
        ['🔧', 'A maintenance bot is fixing the same panel over and over again.'],
        ['🎧', 'A helmet radio picks up a whisper: someone counting backwards from 100.'],
        ['🧫', 'Lab samples in jars. One of the jars is empty and its lid is on the floor.'],
        ['🌌', 'Through the window: a nebula, glowing pink and green.'],
        ['🚪', 'A blast door with deep scratch marks, on the inside.'],
        ['📟', 'A terminal blinks: "OXYGEN 17%. HAVE A NICE DAY."'],
        ['🛰️', 'A satellite drifts by, close enough to read its serial number.']
      ]
    },
    'verdania': {
      intro: 'The Kingdom of Verdania is green, quiet and in trouble. The castle in the clouds has gone silent and the shrines have stopped glowing. The village elder hands you a wooden sword and points at the horizon. Classic.',
      sights: [
        ['🐄', 'A field of cows that all turn to watch you. One of them winks.'],
        ['🧚', 'A tiny glowing fairy follows you for a while, then gets bored.'],
        ['🪨', 'A boulder that looks suspiciously liftable. You leave it alone.'],
        ['🍎', 'Apple trees by the road. You take one. A farmer waves, not angrily.'],
        ['🦉', 'An owl on a signpost hoots something that sounds a lot like advice.'],
        ['🏕️', 'A traveller\'s campfire. A merchant sells "rare" potions. They are just juice.'],
        ['🌊', 'A waterfall with a suspicious cave behind it.'],
        ['🎵', 'You hum a tune and somewhere a hidden door opens. You didn\'t see where.'],
        ['🌻', 'Sunflowers taller than you. Bees the size of plums.'],
        ['❄️', 'The air grows colder and snow starts crunching underfoot.'],
        ['🔥', 'Scorched trees and claw marks the size of doors. Something big lives near here.']
      ]
    },
    'ember-wastes': {
      intro: 'The Age of Fire is ending. The Ember Wastes were a kingdom once, now ash and old bonfires. Undying knights walk the roads they died on. The prophecy says one patient traveller will reach the Last Dawn. It doesn\'t say who.',
      sights: [
        ['🪦', 'A message scratched into the ground: "try walking". Good advice.'],
        ['⚱️', 'An urn full of ash. It is warm.'],
        ['🛡️', 'A shield half buried in the road, with a crest you don\'t recognise.'],
        ['🐦', 'A crow with three eyes follows you from tree to tree.'],
        ['🕯️', 'Candles burn on a ruined altar. Nobody has lit them in a hundred years.'],
        ['⛓️', 'Chains hang from a dead tree, swaying without wind.'],
        ['🧱', 'An illusory wall. You walk right through it. A tiny shortcut.'],
        ['👻', 'A phantom traveller walks next to you for a while, then fades.'],
        ['🌋', 'The ground cracks open and a river of lava glows below.'],
        ['🗡️', 'A knight kneels by the road, frozen in stone, still holding his sword.'],
        ['☀️', 'For a moment the ash clouds part. There is a sun up there after all.']
      ]
    }
  };
  for (const m of window.WQ_MAPS) Object.assign(m, L[m.id] || {});
})();
