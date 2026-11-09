export type DesignerTemplate = {
  id: string;
  name: string;
  category: "Wedding" | "Debut & birthday" | "Corporate" | "Other event";
  description: string;
  mood: string;
  html: string;
  css: string;
};

const details =
  '<p class="eyebrow">14 FEBRUARY 2027 · INTRAMUROS, MANILA</p><h1>Amara <i>&</i> Luca</h1><p class="lead">Together with our families, we invite you to celebrate a day made of little moments and lasting promises.</p><a class="cta" href="#rsvp">JOIN OUR CELEBRATION</a>';

export const designerTemplates: DesignerTemplate[] = [
  {
    id: "eternal-bloom",
    name: "Eternal Bloom",
    category: "Wedding",
    description:
      "Romantic botanicals, a soft editorial hero, and a garden story.",
    mood: "Floral · warm · editorial",
    html: `<header class="hero floral">${details}<div class="flower">✿</div></header><section class="story"><p class="eyebrow">A NOTE FROM US</p><h2>One story, still unfolding.</h2><p>From the first hello to this next chapter, we are grateful for every hand that helped us grow.</p></section><section class="schedule"><p class="eyebrow">THE DAY</p><h2>A little time together</h2><p>4:00 PM · Garden ceremony</p><p>6:00 PM · Dinner & dancing</p></section><section id="rsvp" class="rsvp"><h2>Save your seat</h2><p>Kindly reply by January 20.</p></section>`,
    css: `body{margin:0;background:#f8f6f0;color:#385044;font-family:Georgia,serif}.hero{min-height:640px;padding:10vh 10vw;display:flex;flex-direction:column;justify-content:center;text-align:center;position:relative;overflow:hidden}.floral{background:radial-gradient(ellipse at 80% 20%,#d8e0cb 0,transparent 27%),radial-gradient(ellipse at 12% 90%,#e7d9cb 0,transparent 35%),#f8f6f0}.hero h1{font-size:clamp(64px,11vw,132px);font-weight:400;margin:14px}.hero h1 i{color:#ae806d;font-size:.65em}.eyebrow{letter-spacing:.22em;font:11px Arial,sans-serif}.lead{max-width:550px;margin:18px auto;line-height:1.8}.cta{align-self:center;margin-top:24px;padding:15px 24px;border:1px solid #607863;color:inherit;text-decoration:none;font:11px Arial;letter-spacing:.1em}.flower{position:absolute;right:8%;top:10%;font-size:80px;color:#aabd9e;opacity:.55}.story,.schedule,.rsvp{padding:90px 12vw;text-align:center}.story h2,.schedule h2,.rsvp h2{font-size:42px;font-weight:400}.story>p:last-child{max-width:620px;margin:auto;line-height:1.9}.schedule{background:#e9ede4}.rsvp{background:#445b4c;color:white}`,
  },
  {
    id: "golden-vows",
    name: "Golden Vows",
    category: "Wedding",
    description:
      "A cinematic black-tie invitation with restrained gold details.",
    mood: "Formal · dark · luxe",
    html: `<header class="hero dark"><p class="eyebrow">THE WEDDING OF</p><h1>Amara <i>&</i> Luca</h1><div class="rule"></div><p class="lead">A promise in every season.</p><p>14 · 02 · 2027 &nbsp; / &nbsp; MANILA</p><a class="cta" href="#rsvp">REQUEST THE EVENING</a></header><section class="story"><p class="eyebrow">OUR CELEBRATION</p><h2>An evening in gold</h2><p>We would be honored to have you with us as we begin our life together.</p></section><section id="rsvp" class="rsvp"><h2>Kindly reply</h2><p>Black tie optional · 4:30 in the afternoon</p></section>`,
    css: `body{margin:0;background:#111;color:#f5f0e6;font-family:Georgia,serif}.dark{min-height:690px;padding:10vh 8vw;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:radial-gradient(ellipse,#383126,#111 65%)}.eyebrow{color:#c8ae77;letter-spacing:.25em;font:10px Arial}.hero h1{font-size:clamp(62px,11vw,130px);font-weight:400;margin:24px 0}.hero h1 i{color:#c8ae77}.rule{width:90px;height:1px;background:#c8ae77}.lead{font-size:25px}.cta{margin-top:35px;border:1px solid #c8ae77;padding:15px 24px;color:#e6d5ac;text-decoration:none;font:10px Arial;letter-spacing:.18em}.story,.rsvp{text-align:center;padding:100px 12vw}.story h2,.rsvp h2{font-size:44px;font-weight:400}.story>p:last-child{color:#c8c0ae;line-height:1.9}.rsvp{background:#c8ae77;color:#171612}.rsvp .eyebrow{color:#171612}`,
  },
  {
    id: "enchanted-garden",
    name: "Enchanted Garden",
    category: "Wedding",
    description: "A storybook garden with layered greens and playful details.",
    mood: "Whimsical · leafy · storybook",
    html: `<header class="hero garden"><span class="moon">☾</span><p class="eyebrow">ONCE UPON A TIME</p><h1>Amara & Luca</h1><p class="lead">A garden, a promise, and all our favorite people.</p><a class="cta" href="#rsvp">WANDER WITH US</a></header><section class="story"><p class="eyebrow">OUR STORY</p><h2>Where our paths met</h2><p>Every season brought us closer to this beautiful beginning.</p></section><section class="schedule"><h2>Follow the lanterns</h2><p>4 PM · The vows</p><p>6 PM · Supper beneath the trees</p></section><section id="rsvp" class="rsvp"><h2>Will you join us?</h2></section>`,
    css: `body{margin:0;background:#eef0e5;color:#334c3c;font-family:Georgia,serif}.garden{min-height:630px;padding:9vh 10vw;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;background:radial-gradient(ellipse at 50% 100%,#b9c8a8,transparent 60%),linear-gradient(150deg,#e8eadb,#f8f3e5)}.moon{font-size:50px;color:#b39265}.eyebrow{letter-spacing:.2em;font:10px Arial;color:#70836a}.hero h1{font-size:clamp(56px,10vw,112px);font-weight:400;margin:22px}.lead{font-size:20px}.cta{margin:24px;padding:14px 24px;border-radius:30px;background:#49664e;color:white;text-decoration:none;font:11px Arial}.story,.schedule,.rsvp{text-align:center;padding:80px 12vw}.story h2,.schedule h2,.rsvp h2{font-size:40px;font-weight:400}.story>p:last-child{line-height:1.8}.schedule{background:#dce3d3}.rsvp{background:#49664e;color:white}`,
  },
  {
    id: "timeless-ivory",
    name: "Timeless Ivory",
    category: "Wedding",
    description:
      "Minimal typography and generous ivory space for a quiet celebration.",
    mood: "Minimal · light · timeless",
    html: `<header class="hero ivory"><p class="eyebrow">A CELEBRATION OF LOVE</p><h1>Amara<br><span>and</span><br>Luca</h1><p>FEBRUARY 14, 2027 · MANILA</p><a class="cta" href="#rsvp">DETAILS & RSVP</a></header><section class="story"><h2>With love, always.</h2><p>Please join our families for an intimate celebration of a new beginning.</p></section><section id="rsvp" class="rsvp"><p class="eyebrow">KINDLY REPLY</p><h2>We hope to see you.</h2></section>`,
    css: `body{margin:0;background:#fbfaf7;color:#34342f;font-family:Arial,sans-serif}.ivory{min-height:650px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:9vh 8vw}.eyebrow{letter-spacing:.22em;font-size:10px;color:#927e62}.hero h1{font:clamp(62px,10vw,112px) Georgia,serif;line-height:.94;font-weight:400;margin:28px}.hero h1 span{font-size:.34em;font-style:italic;color:#b3a68e}.cta{margin-top:34px;padding:14px 22px;border:1px solid #b8ad99;text-decoration:none;color:inherit;font-size:10px;letter-spacing:.14em}.story,.rsvp{text-align:center;padding:100px 15vw;border-top:1px solid #e9e6df}.story h2,.rsvp h2{font:40px Georgia,serif;font-weight:400}.story p{max-width:520px;margin:auto;color:#76736c;line-height:1.9}`,
  },
  {
    id: "coastal-romance",
    name: "Coastal Romance",
    category: "Wedding",
    description: "Sun-washed destination wedding with breezy blue accents.",
    mood: "Coastal · airy · relaxed",
    html: `<header class="hero coast"><p class="eyebrow">A DESTINATION WEDDING</p><h1>Amara <i>&</i> Luca</h1><p class="lead">Meet us where the sea meets the sky.</p><p>ANILAO, BATANGAS · 14 FEB 2027</p><a class="cta" href="#rsvp">PLAN YOUR VISIT</a></header><section class="story"><h2>Salt air, soft light, us.</h2><p>A weekend by the water with the people who make every place feel like home.</p></section><section class="schedule"><h2>By the shore</h2><p>4:30 PM · Sunset vows</p><p>6:30 PM · Dinner by the sea</p></section><section id="rsvp" class="rsvp"><h2>Come away with us</h2></section>`,
    css: `body{margin:0;background:#f2f5f1;color:#31505a;font-family:Georgia,serif}.coast{min-height:620px;padding:10vh 8vw;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(180deg,#dbe9e6,#f6f0df 80%)}.eyebrow{font:10px Arial;letter-spacing:.22em;color:#67868a}.hero h1{font-size:clamp(58px,10vw,118px);font-weight:400;margin:24px}.hero h1 i{color:#af9873}.lead{font-size:21px}.cta{margin:24px;padding:15px 24px;background:#547a82;color:white;text-decoration:none;font:10px Arial;letter-spacing:.12em}.story,.schedule,.rsvp{text-align:center;padding:85px 12vw}.story h2,.schedule h2,.rsvp h2{font-size:39px;font-weight:400}.story p{line-height:1.9}.schedule{background:#e1ebe8}.rsvp{background:#547a82;color:white}`,
  },
  {
    id: "celestial-love",
    name: "Celestial Love",
    category: "Wedding",
    description:
      "A midnight sky, fine stars, and an elegant celestial invitation.",
    mood: "Celestial · midnight · graceful",
    html: `<header class="hero stars"><span class="star">✧</span><p class="eyebrow">UNDER THE SAME STARS</p><h1>Amara <i>&</i> Luca</h1><p class="lead">Two paths, one constellation.</p><p>14 FEBRUARY · MANILA</p><a class="cta" href="#rsvp">JOIN OUR ORBIT</a></header><section class="story"><p class="eyebrow">OUR STORY</p><h2>Written in the stars</h2><p>We found our way to each other, and we'd love to celebrate with you.</p></section><section id="rsvp" class="rsvp"><h2>Save your place among the stars</h2></section>`,
    css: `body{margin:0;background:#11182a;color:#f1e9d5;font-family:Georgia,serif}.stars{min-height:650px;padding:10vh 8vw;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 50% 0,#34415d,#11182a 65%)}.star{font-size:50px;color:#d7bd81}.eyebrow{color:#b7a778;font:10px Arial;letter-spacing:.24em}.hero h1{font-size:clamp(58px,10vw,120px);font-weight:400;margin:22px}.hero h1 i{color:#d7bd81}.lead{font-size:22px;color:#ccd0d7}.cta{margin-top:28px;padding:14px 23px;border:1px solid #b7a778;color:#eee0b9;text-decoration:none;font:10px Arial;letter-spacing:.15em}.story,.rsvp{text-align:center;padding:90px 12vw}.story h2,.rsvp h2{font-size:40px;font-weight:400}.story>p:last-child{line-height:1.9;color:#c2c7d1}`,
  },
  {
    id: "sweet-eighteen",
    name: "Sweet Eighteen",
    category: "Debut & birthday",
    description:
      "A modern debut invitation with blush color and a graceful spotlight.",
    mood: "Celebratory · blush · graceful",
    html: `<header class="hero debut"><p class="eyebrow">A NIGHT TO REMEMBER</p><h1>Mikaela's<br><em>18th</em></h1><p class="lead">Please join me for a celebration of growing, dreaming, and everything ahead.</p><p>28 MARCH 2027 · PASIG</p><a class="cta" href="#rsvp">CELEBRATE WITH ME</a></header><section class="story"><h2>Chapter eighteen</h2><p>Made brighter by the people who have been part of every chapter.</p></section><section id="rsvp" class="rsvp"><h2>Save the date</h2><p>Garden formal · 6:00 PM</p></section>`,
    css: `body{margin:0;background:#faf2f1;color:#493a43;font-family:Georgia,serif}.debut{min-height:630px;padding:9vh 10vw;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:radial-gradient(ellipse at 50% 35%,#fff,#f5dfe2)}.eyebrow{color:#ad737f;font:10px Arial;letter-spacing:.22em}.hero h1{font-size:clamp(56px,9vw,105px);font-weight:400;line-height:.95;margin:25px}.hero h1 em{color:#bd7e8d;font-size:1.2em}.lead{max-width:480px;line-height:1.8}.cta{margin:25px;padding:14px 22px;border-radius:28px;background:#ad737f;color:white;text-decoration:none;font:10px Arial;letter-spacing:.1em}.story,.rsvp{text-align:center;padding:85px 12vw}.story h2,.rsvp h2{font-size:40px;font-weight:400}.story p{line-height:1.8}.rsvp{background:#f1dfe0}`,
  },
  {
    id: "midnight-glamour",
    name: "Midnight Glamour",
    category: "Debut & birthday",
    description:
      "A bold birthday celebration with a deep plum stage and bright accents.",
    mood: "Glamorous · bold · nighttime",
    html: `<header class="hero midnight"><p class="eyebrow">YOU'RE ON THE LIST</p><h1>Mikaela<br><span>turns 18</span></h1><p>ONE NIGHT · ALL THE PEOPLE I LOVE</p><a class="cta" href="#rsvp">COUNT ME IN</a></header><section class="story"><h2>Meet me after dark.</h2><p>Dress up, raise a glass, and help me welcome the next chapter.</p></section><section id="rsvp" class="rsvp"><h2>28 March · The Glass Garden</h2></section>`,
    css: `body{margin:0;background:#1c1424;color:#f8edf0;font-family:Arial,sans-serif}.midnight{min-height:650px;padding:9vh 8vw;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 50% 40%,#633553,#1c1424 68%)}.eyebrow{color:#e4a7c6;font-size:10px;letter-spacing:.25em}.hero h1{font:clamp(62px,11vw,130px) Georgia,serif;font-weight:400;line-height:.88;margin:28px}.hero h1 span{font:italic .36em Arial;color:#f2c3a0}.cta{margin-top:28px;padding:15px 28px;background:#e4a7c6;color:#261728;text-decoration:none;font-size:10px;letter-spacing:.14em}.story,.rsvp{text-align:center;padding:90px 12vw}.story h2,.rsvp h2{font:40px Georgia,serif;font-weight:400}.story p{color:#cbbfca;line-height:1.8}.rsvp{background:#33243a}`,
  },
  {
    id: "grand-gala",
    name: "Grand Gala",
    category: "Corporate",
    description:
      "A formal gala page with clear program details and polished hierarchy.",
    mood: "Executive · formal · refined",
    html: `<header class="hero gala"><p class="eyebrow">AN EVENING OF IMPACT</p><h1>Grand<br>Gala 2027</h1><p class="lead">Honoring the people and ideas shaping tomorrow.</p><p>12 JUNE 2027 · MAKATI</p><a class="cta" href="#program">VIEW THE EVENING</a></header><section class="story"><p class="eyebrow">THE OCCASION</p><h2>Progress, together.</h2><p>An evening recognizing a year of shared ambition and meaningful work.</p></section><section id="program" class="schedule"><h2>Program</h2><p>6:00 PM · Reception</p><p>7:00 PM · Dinner & awards</p><p>9:00 PM · Conversation</p></section>`,
    css: `body{margin:0;background:#f3f1eb;color:#263a35;font-family:Arial,sans-serif}.gala{min-height:620px;padding:9vh 10vw;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;background:linear-gradient(110deg,#e4e4dc,#f7f5ef)}.eyebrow{color:#8e7650;font-size:10px;letter-spacing:.2em}.hero h1{font:clamp(65px,10vw,120px) Georgia,serif;font-weight:400;line-height:.9;margin:25px 0}.lead{font:22px Georgia,serif}.cta{margin-top:20px;padding:15px 22px;background:#29443d;color:white;text-decoration:none;font-size:10px;letter-spacing:.12em}.story,.schedule{padding:80px 12vw}.story h2,.schedule h2{font:40px Georgia,serif;font-weight:400}.story p:last-child{max-width:600px;line-height:1.8}.schedule{background:#29443d;color:#f4f0e7}.schedule p{padding:16px 0;border-bottom:1px solid #ffffff30}`,
  },
  {
    id: "modern-summit",
    name: "Modern Summit",
    category: "Corporate",
    description:
      "A crisp conference landing page designed around speakers and sessions.",
    mood: "Modern · confident · clear",
    html: `<header class="hero summit"><p class="eyebrow">MOMENTUM CONFERENCE · 2027</p><h1>Ideas move<br><b>everything.</b></h1><p class="lead">A day for builders, leaders, and the curious.</p><p>18 AUGUST · BGC, TAGUIG</p><a class="cta" href="#schedule">EXPLORE THE PROGRAM</a></header><section class="story"><p class="eyebrow">ONE ROOM. MANY POSSIBILITIES.</p><h2>Build what comes next.</h2><p>Meet the people turning hard questions into practical progress.</p></section><section id="schedule" class="schedule"><h2>On the agenda</h2><p>09:00 · Opening keynote</p><p>11:00 · Breakout sessions</p><p>16:00 · Closing conversation</p></section>`,
    css: `body{margin:0;background:#f6f7f8;color:#172b39;font-family:Arial,sans-serif}.summit{min-height:600px;padding:9vh 10vw;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;background:linear-gradient(120deg,#d9e8ed,#f6f7f8 70%)}.eyebrow{color:#147b8c;font-size:10px;letter-spacing:.18em}.hero h1{font-size:clamp(58px,10vw,112px);line-height:.94;letter-spacing:-.06em;margin:25px 0}.hero h1 b{color:#147b8c}.lead{font-size:20px}.cta{margin-top:20px;padding:15px 22px;background:#147b8c;color:white;text-decoration:none;font-size:10px;letter-spacing:.12em}.story,.schedule{padding:78px 10vw}.story h2,.schedule h2{font-size:38px;letter-spacing:-.04em}.story p:last-child{max-width:550px;line-height:1.8;color:#52626a}.schedule{background:#172b39;color:white}.schedule p{display:inline-block;margin:18px 18px 0 0;padding:16px;border:1px solid #ffffff44}`,
  },
  {
    id: "little-wonders",
    name: "Little Wonders",
    category: "Other event",
    description: "A gentle, joyful welcome for a baby shower or baptism.",
    mood: "Tender · playful · soft",
    html: `<header class="hero wonder"><span class="cloud">☁</span><p class="eyebrow">A LITTLE ONE IS ON THE WAY</p><h1>Little<br><i>Wonders</i></h1><p class="lead">Join us to welcome a beautiful new beginning.</p><p>21 MAY 2027 · QUEZON CITY</p><a class="cta" href="#rsvp">JOIN THE CELEBRATION</a></header><section class="story"><h2>Small hands, big love.</h2><p>We can't wait to share this sweet season with our favorite people.</p></section><section id="rsvp" class="rsvp"><h2>We saved a place for you.</h2></section>`,
    css: `body{margin:0;background:#f7f4eb;color:#58604c;font-family:Georgia,serif}.wonder{min-height:600px;padding:9vh 10vw;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 80%,#e5e7cf,transparent 55%),#f7f4eb}.cloud{font-size:48px;color:#c0cbae}.eyebrow{color:#998f6b;font:10px Arial;letter-spacing:.2em}.hero h1{font-size:clamp(62px,10vw,112px);font-weight:400;line-height:.85;margin:20px}.hero h1 i{color:#c28f82}.lead{font-size:19px}.cta{margin:23px;padding:14px 22px;border-radius:25px;background:#a9b49a;color:#fff;text-decoration:none;font:10px Arial}.story,.rsvp{text-align:center;padding:85px 12vw}.story h2,.rsvp h2{font-size:38px;font-weight:400}.story p{line-height:1.8}.rsvp{background:#e9e7d8}`,
  },
  {
    id: "celebration-noir",
    name: "Celebration Noir",
    category: "Other event",
    description:
      "A versatile private event design with a dramatic monochrome canvas.",
    mood: "Versatile · graphic · elegant",
    html: `<header class="hero noir"><p class="eyebrow">AN OCCASION WORTH KEEPING</p><h1>Celebrate<br><i>together.</i></h1><p class="lead">A special day. A favorite room. The people who matter most.</p><p>24 OCTOBER 2027 · MANILA</p><a class="cta" href="#details">EVENT DETAILS</a></header><section id="details" class="story"><p class="eyebrow">THE GATHERING</p><h2>Make an evening of it.</h2><p>Join us for good conversation, a shared table, and a little celebration.</p></section><section class="schedule"><h2>The evening</h2><p>5:00 PM · Welcome</p><p>7:00 PM · Dinner</p></section>`,
    css: `body{margin:0;background:#eee;color:#222;font-family:Arial,sans-serif}.noir{min-height:620px;padding:9vh 10vw;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;background:linear-gradient(125deg,#1b1b1b,#414141);color:white}.eyebrow{font-size:10px;letter-spacing:.22em;color:#c7b899}.hero h1{font-size:clamp(62px,10vw,116px);line-height:.92;letter-spacing:-.05em;margin:25px 0}.hero h1 i{font:italic .75em Georgia,serif;color:#c7b899}.lead{max-width:500px;font:20px Georgia,serif}.cta{margin-top:22px;padding:14px 22px;border:1px solid #c7b899;color:white;text-decoration:none;font-size:10px;letter-spacing:.12em}.story,.schedule{padding:80px 12vw}.story h2,.schedule h2{font:40px Georgia,serif;font-weight:400}.story p:last-child{max-width:580px;line-height:1.8;color:#666}.schedule{background:#d9d6ce}.schedule p{display:inline-block;padding:16px;margin-right:14px;border-bottom:1px solid #777}`,
  },
];

export const designerDraftStorageKey = "momentus-designer-draft-v1";
