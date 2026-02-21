// ==UserScript==
// @name         Equipment highlighter/filterer for Auctions and Inventory
// @namespace    http://tampermonkey.net/
// @version      2026-01-27
// @description  Equipment
// @author       Fjord [3317544]
// @match        https://www.torn.com/amarket*
// @match        https://www.torn.com/item*
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  //==============================================================
  //=   PUT YOUR HOTKEYS HERE AND ENABLE/DISABLE WHAT YOU LIKE   =
  //==============================================================
  const HOT_KEYS = ['|']
  const ENABLE_WEAPON_SCORE = true
  const ENABLE_AUCTION_LOADER = true
  const ENABLE_AUCTION_LOADER_LOAD_ALL = false  // False due to scraping rules
  const ENABLE_EQUIPMENT_BONUS = true
  const ENABLE_EQUIPMENT_QUALITY = true
  const ENABLE_WEAPON_MODS = true
  //==============================================================
  //==============================================================



  const CSS = `
    /* ===== INVENTORY LARGE BONUS ICONS ===== */
    li[data-armoryid] .bonuses-wrap .bonus.left i[class*="bonus-attachment"][data-bonusid]:nth-of-type(1) {
      transform: scale(2) translate(-3px, 0px);
    }
    li[data-armoryid] .bonuses-wrap .bonus.left i[class*="bonus-attachment"][data-bonusid]:nth-of-type(2) {
      transform: scale(2) translate(0px, 0px);
    }

    /* ===== AUCTION HOUSE LARGE BONUS ICONS ===== */
    .item-cont-wrap .item-bonuses .iconsbonuses {
      > span:nth-of-type(1) i {
        transform: scale(2) translate(-2px, 2px);
      }

      > span:nth-of-type(2) i {
        transform: scale(2) translate(-6px, 2px);
      }
    }

    /* ===== ITEM MARKET LARGE BONUS ICONS ===== */
    div[class^="itemtile__" i] div[class^="modifiersandproperties" i] div[class^="upgradeswrapper__" i] > div[class^="bonuses__"] {
      > i:nth-child(1) {
        transform: scale(2) translate(-6px, 2px);
      }
      > i:nth-child(2) {
        transform: scale(2) translate(-2px, 2px);
      }
    }

    /* ===== AUCTION ENHANCED WEAPON COLOR ===== */
    div[role="tabpanel"] .items-list-wrap .items-list {
      li[id] {
        background: var(--db-bgc);
        outline: 1px solid var(--db-outline);
        outline-offset: -2px;
      }

      li:has(span.glow-yellow) {
        --db-bgc:     rgb(252, 247, 94, 0.1);
        --db-outline: rgba(255, 255, 0,0.4);
      }

      li:has(span.glow-orange) {
        --db-bgc:     rgba(209, 129, 0, 0.2);
        --db-outline: #d08000;
      }

      li:has(span.glow-red) {
        --db-bgc:     #BC243C50;
        --db-outline: #BC243C;
      }

      li span.title {
        p:first-of-type {
          display: none;
        }
      }

      li[id] span.title div.bar {
        z-index: unset;
      }

      li[id]:nth-of-type(1),
      li[id]:nth-of-type(2),
      li[id]:nth-of-type(3) {
        span.title div.eqa-thetip {
          bottom: unset;
          top: calc(100% + 6px);
        }
      }
    }

    /* ===== INVENTORY ENHANCED WEAPON COLOR ===== */
    div.main-items-cont-wrap li[data-equipped][data-armoryid] {
      li.tt-item-price {
        display: none;
      }

      div.title:has(> span[class*="glow"]) {
        background: var(--db-bgc);
        outline: 1px solid var(--db-outline);
        outline-offset: -2px;

        &:has(> span.glow-yellow) {
          --db-bgc:     rgb(252, 247, 94, 0.4);
          --db-outline: rgba(255, 255, 0,0.4);
        }

        &:has(> span.glow-orange) {
          --db-bgc:     rgba(209, 129, 0, 0.4);
          --db-outline: #d08000;
        }

        &:has(> span.glow-red) {
          --db-bgc:     #BC243C50;
          --db-outline: #BC243C;
        }
      }
    }

    div.main-items-cont-wrap > div.items-wrap {
      ul#primary-items,
      ul#secondary-items,
      ul#melee-items,
      ul#armour-items {
        .eqa-bonus {
          position: absolute;
          top: 4px;
          left: 13.5rem;
        }
        .eqa-bonus:nth-of-type(2) {
          left: 20rem;
        }
      }
      .eqa-inventory-filter {
        position: absolute;
        top: 5px;
        left: 15rem;

        label {
          margin-right: 1rem;
        }
      }

      .eqa-mods {
        position: absolute;
        top: 2px;
        left: 55rem;
        display: flex;
        gap: 6px;

        .eqa-mod {
          width: fit-content;
          > div {
            padding: 0 2px;
          }
        }
      }

      .eqa-score {
        top: 2px;
        left: 33rem;
      }

      .eqa-quality {
        top: 4px;
        left: -22px;
      }

      &:not(:has(.eqa-inventory-filter label.eqa-chk.gray   input:checked)) div#category-wrap ul[id] > li[data-armoryid]:not(:has(div.title span.image-wrap[class*="glow"])) {
        display: none;
      }
      &:not(:has(.eqa-inventory-filter label.eqa-chk.yellow input:checked)) div#category-wrap ul[id] > li[data-armoryid]:has(div.title span.image-wrap.glow-yellow) {
        display: none;
      }
      &:not(:has(.eqa-inventory-filter label.eqa-chk.orange input:checked)) div#category-wrap ul[id] > li[data-armoryid]:has(div.title span.image-wrap.glow-orange) {
        display: none;
      }
      &:not(:has(.eqa-inventory-filter label.eqa-chk.red    input:checked)) div#category-wrap ul[id] > li[data-armoryid]:has(div.title span.image-wrap.glow-red) {
        display: none;
      }
    }

    /* ===== ANNOTATIONS ===== */
    .eqa-bar {
      position: relative;
      margin-top: 2px;
      height: 1rem;
      padding: 2px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(0,0,0,0.08)), #1b1d21;
      border-radius: 5px;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 1px rgba(0,0,0,0.35);
      width: 6rem;
      z-index: 20;

      .fill {
        height: 100%;
        display: flex;
        align-items: center;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        color: #f7f8fa;
        text-shadow: 0 1px 1px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5);
        border-radius: 4px;
        overflow: visible;
        white-space: nowrap;
        background-image: linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0));

        &.gray {
          background: linear-gradient(to bottom, #4b4f55, #2f3338);
        }
        &.yellow {
          background: linear-gradient(to bottom, #caa43a, #8f7424);
        }
        &.orange {
          background: linear-gradient(to bottom, #c4661f, #8a4415);
        }
        &.red {
          background: linear-gradient(to bottom, #a83232, #6f1f1f);
        }
        &.common {
          background: linear-gradient(to bottom, #4b4f55, #2f3338);
        }
        &.uncommon {
          background: linear-gradient(to bottom, #1fa60c, #0f5f06);
        }
        &.rare {
          background: linear-gradient(to bottom, #1b6ec6, #023b75);
        }
        &.epic {
          background: linear-gradient(to bottom, #7e3bb3, #4a186f);
        }
        &.legendary {
          background: linear-gradient(-45deg, #eeeeee33 35%, #fafafa77 50%, #eeeeee33 60%), linear-gradient(to bottom, #c4661f, #8a4415);
          background-size: 300%;
          background-position-x: 100%;
          animation: shimmer 2s infinite linear;
        }
        &.artifact {
          background: linear-gradient(-45deg, #eeeeee33 35%, #fafafa77 50%, #eeeeee33 60%), linear-gradient(to bottom, #a83232, #6f1f1f);
          background-size: 300%;
          background-position-x: 100%;
          animation: shimmer 1.2s infinite linear;
        }
        &.low {
          background: linear-gradient(to bottom, #caa43a, #8f7424);
        }
        &.medium {
          background: linear-gradient(to bottom, #c4661f, #8a4415);
        }
        &.high {
          background: linear-gradient(to bottom, #a83232, #6f1f1f);
        }

        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0));
          pointer-events: none;
        }
      }
    }

    .eqa-bonus {
    }

    .eqa-score {
      position: absolute;
      top: -50px;
      left: -6px;
      width: 2.3rem;
    }

    .eqa-quality {
      position: absolute;
      top: -26px;
      left: -6px;
      width: 2.3rem;
    }

    .eqa-auction-loader {
      position: absolute;
      top: -24px;
      right: 13rem;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: #e5e7eb;
      text-shadow: 0 1px 1px rgba(0,0,0,0.6);
    }

    .eqa-button.eqa-auction-loader-button {
      position: absolute;
      top: -30px;
      left: 44rem;
      background: linear-gradient(180deg, #111111 0%, #555555 18%, #333333 60%, #333333 74%, #111111 100%);
      display: flex;
      align-items: center;
      height: 28px;
      user-select: none;
    }

    .eqa-button.eqa-auction-loader-button.prev {
      left: 40rem;
    }

    .eqa-tooltip {
      cursor: pointer;
      overflow: visible;

      &:hover {
        .eqa-thetip {
          opacity: 1;
          transform: translate(-50%, -2px);
        }
      }

      .eqa-tooltipwrapper {
        position: relative;
      }

      .eqa-thetip {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        padding: 4px 8px;
        transform: translateX(-50%);
        background: linear-gradient( to bottom, #1b1e24, #0f1116 );
        color: #e5e7eb;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        white-space: nowrap;
        line-height: 24px;
        z-index: 99999;
        min-width: 6rem;

        .eqa-tooltip-title {
          margin: 0 8px 3px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        > ul >li {
          display: flex;
          justify-content: space-between;
          gap: 12px;

          &.yellow {
            color: #caa43a;
          }
          &.orange {
            color: #c4661f;
          }
          &.red {
            color: #a83232;
          }
        }
      }
    }

    .eqa-pending {
      position: absolute;
      top: -24px;
      right: 90px;
    }

    .eqa-auction-filter {
      float: left;
      position: relative;
      margin-top: 8px;
      display: flex;
      align-items: center;

      &::after {
        content: "Filters";
        position: absolute;
        top: -15px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        color: #e5e7eb;
        text-shadow: 0 1px 1px rgba(0,0,0,0.6);
        background: radial-gradient(closest-side, rgba(255,255,255,0.75), rgba(255,255,255,0)) left center / 45% 1px no-repeat, radial-gradient(closest-side, rgba(255,255,255,0.75), rgba(255,255,255,0)) right center / 45% 1px no-repeat;
      }

      > input {
        height: 2rem;
        margin-right: 1rem;
        width: 5.5rem;
        padding-left: 0.4rem;
      }
    }

    label.eqa-chk {
      --c: #888;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-right: 0.4rem;
      cursor: pointer;
      user-select: none;
      font-size: 0.8rem;
      color: #d1d5db;

      &.gray {
        --c: #4b4f55;
      }
      &.yellow {
        --c: #8f7424;
      }
      &.orange {
        --c: #8a4415;
      }
      &.red {
        --c: #6f1f1f;
      }

      > input {
        display: none;
      }

      > span {
        width: 1rem;
        height: 1rem;
        border-radius: 4px;
        background: linear-gradient(to bottom, color-mix(in srgb, var(--c), #fff 8%), color-mix(in srgb, var(--c), #000 18%));
        border: 1px solid color-mix(in srgb, var(--c), #000 35%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4);

        &::after {
          content: '';
          width: 4px;
          height: 8px;
          border-right: 2px solid #f5f7fa;
          border-bottom: 2px solid #f5f7fa;
          transform: rotate(45deg) scale(0.6);
          opacity: 0;
          position: absolute;
          margin-left: 5px;
          margin-top: 1px;
          transition: opacity 120ms ease, transform 120ms ease;
        }
      }

      > input:checked + span::after {
        opacity: 1;
        transform: rotate(45deg) scale(1);
      }

      &:hover > span {
        filter: brightness(1.08);
      }

      input:focus-visible + span {
        outline: 2px solid color-mix(in srgb, var(--c), #fff 35%);
        outline-offset: 2px;
      }
    }

    @keyframes shimmer {
      to { background-position-x: 0% }
    }

  `
  const RangedWeaponStats = {
    // Primary
    '9mm Uzi': { rof: 20, ammo: 90 },
    'AK-47': { rof: 6, ammo: 90 },
    'AK74U': { rof: 5, ammo: 90 },
    'ArmaLite M-15A4': { rof: 4, ammo: 45 },
    'Benelli M1 Tactical': { rof: 2.5, ammo: 21 },
    'Benelli M4 Super': { rof: 2.5, ammo: 21 },
    'Bushmaster Carbon 15': { rof: 15, ammo: 90 },
    'Dual Bushmasters': { rof: 17, ammo: 180 },
    'Dual MP5s': { rof: 13, ammo: 180 },
    'Dual P90s': { rof: 15, ammo: 300 },
    'Dual TMPs': { rof: 20, ammo: 90 },
    'Dual Uzis': { rof: 20, ammo: 180 },
    'Egg Propelled Launcher': { rof: 405, ammo: 3000 },
    'Enfield SA-80': { rof: 3.5, ammo: 90 },
    'Gold Plated AK-47': { rof: 5, ammo: 135 },
    'Heckler & Koch SL8': { rof: 5.5, ammo: 30 },
    'Ithaca 37': { rof: 2.5, ammo: 12 },
    'Jackhammer': { rof: 7.5, ammo: 30 },
    'M16 A2 Rifle': { rof: 7, ammo: 90 },
    'M249 SAW': { rof: 20, ammo: 300 },
    'M4A1 Colt Carbine': { rof: 6.5, ammo: 90 },
    'Mag 7': { rof: 3, ammo: 15 },
    'Minigun': { rof: 25, ammo: 600 },
    'MP 40': { rof: 4, ammo: 96 },
    'MP5 Navy': { rof: 6.5, ammo: 90 },
    'Neutrilux 2000': { rof: 383, ammo: 3000 },
    'Nock Gun': { rof: 7, ammo: 21 },
    'P90': { rof: 20, ammo: 150 },
    'PKM': { rof: 13, ammo: 150 },
    'Prototype': { rof: 25, ammo: 300 },
    'Rheinmetall MG 3': { rof: 25, ammo: 300 },
    'Sawed-Off Shotgun': { rof: 1.5, ammo: 6 },
    'SIG 550': { rof: 5.5, ammo: 60 },
    'SKS Carbine': { rof: 4.5, ammo: 30 },
    'Snow Cannon': { rof: 6.5, ammo: 2850 },
    'Steyr AUG': { rof: 6.5, ammo: 90 },
    'Stoner 96': { rof: 11.5, ammo: 300 },
    'SIG 552': { rof: 5.5, ammo: 90 },
    'Tavor TAR-21': { rof: 6, ammo: 90 },
    'Thompson': { rof: 4, ammo: 60 },
    'Vektor CR-21': { rof: 7.5, ammo: 60 },
    'XM8 Rifle': { rof: 12.5, ammo: 90 },
    'Negev NG-5': { rof: 22.5, ammo: 600 },
    // Secondary
    'Type 98 Anti Tank': { rof: 1, ammo: 3 },
    'Beretta 92FS': { rof: 4.5, ammo: 60 },
    'Beretta M9': { rof: 4.5, ammo: 51 },
    'Beretta Pico': { rof: 1.5, ammo: 18 },
    'Blowgun': { rof: 1, ammo: 3 },
    'Blunderbuss': { rof: 1, ammo: 3 },
    'BT MP9': { rof: 13.5, ammo: 90 },
    'China Lake': { rof: 1, ammo: 9 },
    'Cobra Derringer': { rof: 1.5, ammo: 6 },
    'Crossbow': { rof: 1, ammo: 3 },
    'Desert Eagle': { rof: 2.5, ammo: 24 },
    'Dual 92G Berettas': { rof: 10, ammo: 138 },
    'Fiveseven': { rof: 6.5, ammo: 60 },
    'Flamethrower': { rof: 1, ammo: 3 },
    'Flare Gun': { rof: 1, ammo: 3 },
    'Glock 17': { rof: 4.5, ammo: 60 },
    'Harpoon': { rof: 1, ammo: 3 },
    'Homemade Pocket Shotgun': { rof: 1, ammo: 3 },
    'Lorcin 380': { rof: 3, ammo: 18 },
    'Luger': { rof: 2, ammo: 24 },
    'Magnum': { rof: 1.5, ammo: 18 },
    'Milkor MGL': { rof: 1, ammo: 18 },
    'MP5k': { rof: 6, ammo: 45 },
    'Pink Mac-10': { rof: 12.5, ammo: 360 },
    'Qsz-92': { rof: 7, ammo: 45 },
    'Raven MP25': { rof: 4, ammo: 18 },
    'RPG Launcher': { rof: 1, ammo: 3 },
    'Ruger 57': { rof: 3.5, ammo: 60 },
    'S&W M29': { rof: 3.5, ammo: 18 },
    'S&W Revolver': { rof: 1.5, ammo: 18 },
    'Skorpion': { rof: 4, ammo: 60 },
    'Slingshot': { rof: 1, ammo: 3 },
    'SMAW Launcher': { rof: 1, ammo: 3 },
    'Springfield 1911': { rof: 2.5, ammo: 24 },
    'Taser': { rof: 1, ammo: 6 },
    'Taurus': { rof: 6.5, ammo: 39 },
    'TMP': { rof: 4.5, ammo: 45 },
    'Tranquilizer Gun': { rof: 1, ammo: 3 },
    'USP': { rof: 4.5, ammo: 45 },
  }
  const MeleeWeaponStats = {
    'Kama': { bonus: 1.1 },
    'Katana': { bonus: 1.1 },
    'Kodachi': { bonus: 1.1 },
    'Sai': { bonus: 1.1 },
    'Samurai Sword': { bonus: 1.1 },
    'Yasukuni Sword': { bonus: 1.1 },
  }
  const MeleeWeapons = [
    'Axe',
    'Baseball Bat',
    'Blood Spattered Sickle',
    'Bone Saw',
    'Bo Staff',
    'Bread Knife',
    'Bug Swatter',
    'Butterfly Knife',
    'Cattle Prod',
    'Chain Whip',
    'Chainsaw',
    'Claymore Sword',
    'Cleaver',
    'Cricket Bat',
    'Crowbar',
    'Dagger',
    'Devil\'s Pitchfork',
    'Diamond Bladed Knife',
    'Diamond Icicle',
    'Dual Axes',
    'Dual Hammers',
    'Dual Samurai Swords',
    'Dual Scimitars',
    'Duke\'s Hammer',
    'Fine Chisel',
    'Flail',
    'Frying Pan',
    'Golden Broomstick',
    'Golf Club',
    'Guandao',
    'Hammer',
    'Handbag',
    'Ice Pick',
    'Ivory Walking Cane',
    'Kama',
    'Katana',
    'Kitchen Knife',
    'Knuckle Dusters',
    'Kodachi',
    'Lead Pipe',
    'Leather Bullwhip',
    'Macana',
    'Madball',
    'Meat Hook',
    'Metal Nunchakus',
    'Naval Cutlass',
    'Ninja Claws',
    'Pair of High Heels',
    'Pair of Ice Skates',
    'Pen Knife',
    'Penelope',
    'Petrified Humerus',
    'Pillow',
    'Plastic Sword',
    'Poison Umbrella',
    'Riding Crop',
    'Rusty Sword',
    'Sai',
    'Samurai Sword',
    'Scalpel',
    'Scimitar',
    'Sledgehammer',
    'Spear',
    'Swiss Army Knife',
    'Twin Tiger Hooks',
    'Wand of Destruction',
    'Wooden Nunchaku',
    'Wushu Double Axes',
    'Yasukuni Sword'
  ]
  const EquipmentBonuses = {
    // Weapons
    Achilles: { yellow: { low: 50, high: 73 }, orange: { low: 77, high: 98 }, red: { low: 114, high: 169 } },
    Assassinate: { yellow: { low: 50, high: 69 }, orange: { low: 70, high: 93 }, red: { low: 101, high: 148 } },
    Backstab: { yellow: { low: 30, high: 40 }, orange: { low: 45, high: 52 }, red: { low: 79, high: 96 } },
    Berserk: { yellow: { low: 20, high: 34 }, orange: { low: 39, high: 54 }, red: { low: 60, high: 87 } },
    Bleed: { yellow: { low: 20, high: 30 }, orange: { low: 31, high: 45 }, red: { low: 53, high: 72 } },
    Blindside: { yellow: { low: 25, high: 37 }, orange: { low: 41, high: 59 }, red: { low: 73, high: 96 } },
    Bloodlust: { yellow: { low: 10, high: 12 }, orange: { low: 12, high: 14 }, red: { low: 17, high: 17 } },
    Comeback: { yellow: { low: 50, high: 66 }, orange: { low: 70, high: 99 }, red: { low: 102, high: 127 } },
    Conserve: { yellow: { low: 25, high: 29 }, orange: { low: 30, high: 36 }, red: { low: 43, high: 49 } },
    Cripple: { yellow: { low: 20, high: 28 }, orange: { low: 29, high: 40 }, red: { low: 52, high: 58 } },
    Crusher: { yellow: { low: 50, high: 72 }, orange: { low: 76, high: 102 }, red: { low: 133, high: 133 } },
    Cupid: { yellow: { low: 50, high: 74 }, orange: { low: 75, high: 110 }, red: { low: 124, high: 161 } },
    Deadeye: { yellow: { low: 25, high: 45 }, orange: { low: 46, high: 73 }, red: { low: 76, high: 123 } },
    Deadly: { yellow: { low: 2, high: 3 }, orange: { low: 4, high: 6 }, red: { low: 9, high: 9 } },
    Disarm: { yellow: { low: 3, high: 5 }, orange: { low: 5, high: 9 }, red: { low: 9, high: 15 } },
    'Double-edged': { yellow: { low: 10, high: 15 }, orange: { low: 16, high: 24 }, red: { low: 32, high: 32 } },
    'Double Tap': { yellow: { low: 15, high: 23 }, orange: { low: 25, high: 35 }, red: { low: 40, high: 57 } },
    Empower: { yellow: { low: 52, high: 85 }, orange: { low: 90, high: 141 }, red: { low: 180, high: 222 } },
    Eviscerate: { yellow: { low: 15, high: 18 }, orange: { low: 19, high: 24 }, red: { low: 26, high: 34 } },
    Execute: { yellow: { low: 15, high: 18 }, orange: { low: 18, high: 22 }, red: { low: 23, high: 30 } },
    Expose: { yellow: { low: 7, high: 9 }, orange: { low: 10, high: 14 }, red: { low: 14, high: 21 } },
    Finale: { yellow: { low: 10, high: 11 }, orange: { low: 12, high: 13 }, red: { low: 13, high: 17 } },
    Focus: { yellow: { low: 15, high: 19 }, orange: { low: 20, high: 24 }, red: { low: 32, high: 35 } },
    Frenzy: { yellow: { low: 5, high: 7 }, orange: { low: 7, high: 9 }, red: { low: 10, high: 14 } },
    Fury: { yellow: { low: 10, high: 15 }, orange: { low: 16, high: 23 }, red: { low: 26, high: 36 } },
    Grace: { yellow: { low: 20, high: 31 }, orange: { low: 38, high: 49 }, red: { low: 60, high: 66 } },
    'Home run': { yellow: { low: 50, high: 59 }, orange: { low: 62, high: 71 }, red: { low: 71, high: 93 } },
    Motivation: { yellow: { low: 15, high: 19 }, orange: { low: 19, high: 25 }, red: { low: 26, high: 35 } },
    Paralyze: { yellow: { low: 5, high: 8 }, orange: { low: null, high: null }, red: { low: 17, high: 17 } },
    Parry: { yellow: { low: 50, high: 59 }, orange: { low: 62, high: 71 }, red: { low: 71, high: 87 } },
    Penetrate: { yellow: { low: 25, high: 29 }, orange: { low: 30, high: 37 }, red: { low: 38, high: 49 } },
    Plunder: { yellow: { low: 20, high: 25 }, orange: { low: 26, high: 33 }, red: { low: 36, high: 49 } },
    Powerful: { yellow: { low: 15, high: 21 }, orange: { low: 22, high: 32 }, red: { low: 33, high: 49 } },
    Proficience: { yellow: { low: 20, high: 28 }, orange: { low: 29, high: 38 }, red: { low: 44, high: 59 } },
    Puncture: { yellow: { low: 20, high: 27 }, orange: { low: 29, high: 39 }, red: { low: 41, high: 57 } },
    Quicken: { yellow: { low: 50, high: 88 }, orange: { low: 91, high: 149 }, red: { low: 154, high: 219 } },
    Rage: { yellow: { low: 4, high: 6 }, orange: { low: 4, high: 10 }, red: { low: 11, high: 18 } },
    Revitalize: { yellow: { low: 10, high: 13 }, orange: { low: 13, high: 17 }, red: { low: 18, high: 24 } },
    Roshambo: { yellow: { low: 50, high: 69 }, orange: { low: 76, high: 90 }, red: { low: 132, high: 132 } },
    Slow: { yellow: { low: 20, high: 28 }, orange: { low: 29, high: 42 }, red: { low: 43, high: 64 } },
    Smurf: { yellow: { low: 1, high: 1 }, orange: { low: 2, high: 3 }, red: { low: 5, high: 5 } },
    Specialist: { yellow: { low: 20, high: 27 }, orange: { low: 28, high: 38 }, red: { low: 40, high: 53 } },
    Stricken: { yellow: { low: 30, high: 43 }, orange: { low: 44, high: 54 }, red: { low: 85, high: 96 } },
    Stun: { yellow: { low: 10, high: 15 }, orange: { low: 16, high: 23 }, red: { low: 25, high: 40 } },
    Suppress: { yellow: { low: 25, high: 31 }, orange: { low: 33, high: 40 }, red: { low: null, high: 49 } },
    'Sure Shot': { yellow: { low: 3, high: 4 }, orange: { low: 5, high: 8 }, red: { low: 8, high: 11 } },
    Throttle: { yellow: { low: 50, high: 71 }, orange: { low: 76, high: 105 }, red: { low: 119, high: 170 } },
    Warlord: { yellow: { low: 15, high: 19 }, orange: { low: 20, high: 27 }, red: { low: 28, high: 45 } },
    Weaken: { yellow: { low: 20, high: 28 }, orange: { low: 29, high: 40 }, red: { low: 44, high: 63 } },
    'Wind-up': { yellow: { low: 125, high: 145 }, orange: { low: 145, high: 167 }, red: { low: 177, high: 221 } },
    Wither: { yellow: { low: 20, high: 28 }, orange: { low: 29, high: 42 }, red: { low: 43, high: 63 } },
    // Armor
    // Riot
    Impregnable: { low: 20, high: 29},
    // Assault
    Impenetrable: { low: 20, high: 29 },
    // Dune
    Insurmountable: { low: 30, high: 39 },
    // Delta
    Invulnerable: { Mask: { low: 12, high: 14 }, Body: { low: 8, high: 10 }, Pants: { low: 7, high: 9 }, Gloves: { low: 4, high: 6 }, Boots: { low: 4, high: 7 } },
    // Marauder
    Imperviable: { Mask: { low: 5, high: 7 }, Body: { low: 7, high: 10 }, Pants: { low: 4, high: 6 }, Gloves: { low: 2, high: 3 }, Boots: { low: 2, high: 3 } },
    // Sentinel
    Immutable: { Helmet: { low: 30, high: 40 }, Apron: { low: 40, high: 50 }, Pants: { low: 25, high: 31 }, Gloves: { low: 15, high: 18 }, Boots: { low: 15, high: 19 } },
    // Vanguard
    Irrepressible: { Respirator: { low: 30, high: 39 }, Body: { low: 40, high: 52 }, Pants: { low: 25, high: 33 }, Gloves: { low: 15, high: 18 }, Boots: { low: 15, high: 19 } },
    // EOD
    Impassable: { low: 30, high: 39 },
  }
  const AmmoConservation = 1.25
  const CombatTurns = 15
  const ClassScore = 'eqa-score'
  const ClassBonus = 'eqa-bonus'
  const ClassQuality = 'eqa-quality'
  const ClassAnnotated = 'eqa-annotated'
  const ClassAuctionFilter = 'eqa-auction-filter'
  const ClassInventoryFilter = 'eqa-inventory-filter'
  const ClassBar = 'eqa-bar'
  const ClassTooltip = 'eqa-tooltip'
  const AuctionLoader = 'ul.items-list > li.last > span.ajax-preloader'
  const InventoryLoader = 'li > span.ajax-preloader'
  const Configurations = {
    Auction: {
      Item: `div#auction-house-tabs li > div.item-cont-wrap:has(div.item-bonuses):not(:has(.${ ClassAnnotated }))`,
      Damage: 'i.bonus-attachment-item-damage-bonus ~ span',
      Accuracy: 'i.bonus-attachment-item-accuracy-bonus ~ span',
      Name: 'span.title > span',
      Color: 'span.item-plate[class*="glow"]',
      Bonuses: '.iconsbonuses .bonus-attachment-icons',
      DisplayScore: 'div.iconsbonuses',
      DisplayBonus: '.title',
      DisplayQuality: 'div.iconsbonuses',
    },
    Inventory: {
      Item: `div.main-items-cont-wrap li[data-armoryid]:not(:has(.${ ClassAnnotated }))`,
      ItemAnnotated: `div.main-items-cont-wrap li[data-armoryid]:has(.${ ClassAnnotated })`,
      Damage: 'ul.bonuses-wrap > li > i.bonus-attachment-item-damage-bonus ~ span',
      Accuracy: 'ul.bonuses-wrap > li > i.bonus-attachment-item-accuracy-bonus ~ span',
      Name: 'div.title-wrap span.name-wrap span.name',
      Color: 'div.title-wrap > div.title > span.image-wrap',
      Bonuses: 'ul.bonuses-wrap li.bonus:not([data-attachments-itemid]) > i',
      Mods: 'ul.bonuses-wrap li.bonus[data-attachments-itemid] > i',
      DisplayScore: 'div.cont-wrap > div.bonuses',
      DisplayBonus: 'div.title-wrap > div.title.left',
      DisplayQuality: 'div.title-wrap',
    },
  }

  const l = console.log

  const queue = []
  const queuerun = _ => {
    if(!queue.length) {
      queuerun.running = false
      return
    }
    queuerun.running = true
    setTimeout(async _ => {
      let nextrequest = queue.shift()
      updatePendingNumber(queue.length)
      if(nextrequest.args) { await nextrequest.func(...nextrequest.args) }
      else { await nextrequest.func() }
      queuerun()
    }, 150)
  }

  const queueadd = async (func, args) => {
    queue.push({func: func, args: args})
    if(queuerun.running) { return }
    queuerun()
  }

  const clamp = (n, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), n))

  const isAuction   = _ => window.location.href.startsWith('https://www.torn.com/amarket.php')
  const isInventory = _ => window.location.href.startsWith('https://www.torn.com/item.php')

  const isWeapons = url => (isAuction() && (url || window.location.href).includes('weapons')) ||
                           (isInventory() && ['Primary', 'Secondary', 'Melee'].includes(document.querySelector('div.main-items-cont-wrap div[role="heading"] span.items-name')?.textContent))

  const isArmor = url => (isAuction() && (url || window.location.href).includes('armor')) ||
                         (isInventory() && ['Armor'].includes(document.querySelector('div.main-items-cont-wrap div[role="heading"] span.items-name')?.textContent))

  const isEquipment = _ => isArmor() || isWeapons()

  const getArmorPart = item => (isAuction() && item.querySelector('span.item-name')?.textContent.split(' ').at(-1)) ||
                               (isInventory() && item.querySelector('span.name-wrap > span.name')?.textContent.split(' ').at(-1));

  const createElement = (type, classes, text, on_click) => {
    let el = document.createElement(type)
    if(classes?.length) { el.classList.add(...classes) }
    if(text)            { el.innerHTML = text }
    if(on_click)        { el.addEventListener('click', on_click) }
    return el
  }

  const createAuctionElements = _ => {
    const selParent = 'div.auction-market-main-cont > div.add-listing'
    const selNextPage = 'a[href^="amarket.php#itemtab=armor"] > i.pagination-right'
    const selPrevPage = 'a[href^="amarket.php#itemtab=armor"] > i.pagination-left'

    let weaponsContainerEl = document.createElement('div')
    let armorContainerEl   = document.createElement('div')

    armorContainerEl.appendChild(createElement('div', ['torn-btn', 'eqa-auction-loader-button', 'eqa-button'],         'Next', _ => document.querySelector(selNextPage)?.click()))
    armorContainerEl.appendChild(createElement('div', ['torn-btn', 'eqa-auction-loader-button', 'eqa-button', 'prev'], 'Prev', _ => document.querySelector(selPrevPage)?.click()))
    armorContainerEl.appendChild(createElement('div', ['eqa-auction-loader']))
    document.querySelector(selParent).appendChild(armorContainerEl)

    weaponsContainerEl.appendChild(createElement('div', [ 'eqa-auction-loader-button', 'eqa-button'], 'Load'))
    weaponsContainerEl.appendChild(createElement('div', ['eqa-auction-loader']))
    document.querySelector(selParent).appendChild(weaponsContainerEl)

    return { armor: armorContainerEl,
             weapons: weaponsContainerEl,
             armorPage: armorContainerEl.lastElementChild,
             weaponsPage: weaponsContainerEl.lastElementChild,
             weaponsLoad: weaponsContainerEl.firstElementChild,
            }
  }

  const updatePendingNumber = pending => {
    if(!isAuction()) { return }
    let el = document.querySelector('div.eqa-pending')
    if(!el) {
      el = createElement('div', ['eqa-pending'])
      document.querySelector('div.auction-market-main-cont > div.add-listing').appendChild(el)
    }
    if(!pending) {
      el.style.display = 'none'
      return
    }
    el.innerText = `Pending ${ pending }`
    el.style.display = 'block'
  }


  let auctionElements = null
  const auctionPageLoader = _ => {
    if(!isAuction() || document.querySelector(`.eqa-auction-loader`) || !ENABLE_AUCTION_LOADER) { return }

    const listingID = {
      weapons: '#types-tab-1',
      armor: '#types-tab-2',
    }
    let currentPage = {
      weapons: 10,
      armor: 10
    }

    const getEndPage = _ => parseInt(document.querySelector('a.page-number.last[page]')?.textContent || 0) * 10
    const getItemType = _ => window.location.hash.split('&')[0].split('itemtab=')[1]
    const render = item => `<li class="" id="${ item.ID }"><div class="item-cont-wrap"><span class="img-wrap"><span class="item-plate ${ item.glowClass }"><img class="item torn-item large" src="/images/items/${ item.itemID }/large.png"></span><span class="item-hover" item="${ item.itemID }" armoury="${ item.armouryID }" loaded="0" href="imarket.php?step=getiteminfo"><button class="view-info wai-btn" aria-label="${ item.arialabel }" i-data="i_202_287_100_50"></button></span></span><span class="title"><span class="bold t-blue item-name c-pointer" href="iteminfo.php?ID=${ item.itemID }">${ item.itemName }</span><p class="t-gray-6">(${ item.rare })</p></span><div class="item-bonuses">${ item.item_image_icons }</div></div><div class="seller-wrap"><div class="name">Item seller:<a href="${ item.seller.link }">${ item.seller.name }</a></div><div class="delimiter"><div class="l-delimiter"></div><div class="r-delimiter"></div></div><div class="namehight">High bidder:<a href="${ item.hightbidder.link }">${ item.hightbidder.name }</a></div></div><div class="bids-wrap">${ item.bids } bids</div><div class="c-bid-wrap">${ item.topbid }</div><div class="bid-wrap"><a class="bid-icon" role="button" href="#"></a><span class="bid-btn btn-wrap silver"><span class="bid btn"><button class="torn-btn">BID</button></span></span></div><div class="time-wrap"><span title="${ item.enddate }"><i class="timer-icon"></i><span>${ item.timer.d ? `${ item.timer.d }d ` : "" }${ item.timer.h ? `${ item.timer.h }h ` : "" }${ item.timer.m ? `${ item.timer.m }m ` : "" }${ item.timer.s ? `${ item.timer.s }s ` : "" }</span></span></div></li>`
    const getPage = async (start, callback) => getAction({ type: 'post', action: 'amarket.php', success: str => callback(str), data: { step: 'getAuctionItemsList', itemType: getItemType(), start: start } })
    const getListingEl = _ => document.querySelector(`${ listingID[getItemType()] } > div > ul`)
    const handlePage = str => {
      JSON.parse(str)?.list?.forEach(i => getListingEl().insertAdjacentHTML('beforeend', render(i)))
      updatePageNumber(window.location.href)
    }

    const updatePageNumber = _ => {
      if(!isAuction()) { return }
      const url = window.location.href
      const selCurrPage = 'div#types-tab-2 a.page-number.active.page-show[page]'
      const selLastPage = 'div#types-tab-2 a.page-number.page-show[page]'
      auctionElements.armor.style.display = url.includes('armor') ? 'block' : 'none'
      auctionElements.armorPage.textContent = `Page ${document.querySelector(selCurrPage)?.getAttribute('page') || ''}/${parseInt(Array.from(document.querySelectorAll(selLastPage))?.at(-1)?.getAttribute('page')) || ''}`
      auctionElements.weapons.style.display = url.includes('weapons') ? 'block' : 'none'
      auctionElements.weaponsPage.textContent = `Loaded ${ parseInt(currentPage[getItemType()] / 10) }/${ parseInt(getEndPage() / 10) } pages`
    }

    const load = async _ => {
      if(getItemType() !== 'weapons') { return }
      if(currentPage[getItemType()] >= getEndPage()) { return }
      await getPage(currentPage[getItemType()], handlePage)
      currentPage[getItemType()] += 10
      if(ENABLE_AUCTION_LOADER_LOAD_ALL) {
        queueadd(load)
      }
    }

    if(!auctionElements) {
      auctionElements = createAuctionElements()
    }

    auctionElements.weaponsLoad.addEventListener('click', _ => queueadd(load))
    document.addEventListener('keydown', async e => HOT_KEYS.includes(e.key) && queueadd(load))
    window.addEventListener('hashchange', e => {
      currentPage.weapons = 10
      currentPage.armor = 10
      setTimeout(_ => updatePageNumber(e.newURL), 500)
    })
    setTimeout(_ => updatePageNumber(e.newURL), 500)
  }

  const initAuctionFilters = _ => {
    if(document.querySelector(`.${ClassAuctionFilter}`) || !isAuction()) { return }
    let filtercont = document.createElement('div')
    filtercont.classList.add(ClassAuctionFilter)

    let armorFilter = document.createElement('input')
    armorFilter.setAttribute('list', 'eqa-auction-armor-filter-list')
    armorFilter.setAttribute('name', 'eqa-auction-armor-filter')
    armorFilter.setAttribute('placeHolder', 'All armors')
    armorFilter.style.display = 'none'
    let armorFilterList = document.createElement('datalist')
    armorFilterList.id = 'eqa-auction-armor-filter-list';
    ['All armors', 'Assault', 'Delta', 'Dune', 'EOD', 'Marauder', 'Riot', 'Sentinel', 'Vanguard'].forEach(a => {
      let option = document.createElement('option')
      option.value = a
      armorFilterList.appendChild(option)
    })
    filtercont.appendChild(armorFilter)
    filtercont.appendChild(armorFilterList)

    let weaponFilter = document.createElement('input')
    weaponFilter.setAttribute('list', 'eqa-auction-weapon-filter-list')
    weaponFilter.setAttribute('name', 'eqa-auction-weapon-filter')
    weaponFilter.setAttribute('placeHolder', 'All weapons')
    let weaponFilterList = document.createElement('datalist')
    weaponFilterList.id = 'eqa-auction-weapon-filter-list';
    ['All weapons'].concat(Object.keys(RangedWeaponStats).concat(MeleeWeapons).toSorted()).forEach(w => {
      let option = document.createElement('option')
      option.value = w
      weaponFilterList.appendChild(option)
    })
    filtercont.appendChild(weaponFilter)
    filtercont.appendChild(weaponFilterList)

    let bonusFilter = document.createElement('input')
    bonusFilter.setAttribute('list', 'eqa-auction-bonus-filter-list')
    bonusFilter.setAttribute('name', 'eqa-auction-bonus-filter')
    bonusFilter.setAttribute('placeHolder', 'All bonuses')
    let bonusFilterList = document.createElement('datalist')
    bonusFilterList.id = 'eqa-auction-bonus-filter-list';
    ['All bonuses'].concat(Object.keys(EquipmentBonuses).toSorted()).forEach(b => {
      let option = document.createElement('option')
      option.value = b
      bonusFilterList.appendChild(option)
    })
    filtercont.appendChild(bonusFilter)
    filtercont.appendChild(bonusFilterList);

    ['yellow', 'orange', 'red'].forEach(c => {
      let label = document.createElement('label')
      label.classList.add('eqa-chk', c)
      let input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('eqacolor', c)
      input.checked = true
      label.appendChild(input)
      label.appendChild(document.createElement('span'))
      filtercont.appendChild(label)
    })

    const filterListings = _ => {
      if(!isAuction() && !isInventory()) { return }
      document.querySelectorAll('ul.items-list > li[id]').forEach(listing => {
        let display = true
        if(armorFilter.value !== 'All armors' && armorFilter.value.length && !listing.querySelector(`span.img-wrap > span.item-hover > button[aria-label*="${ armorFilter.value }"]`)) {
          display = false
        }
        if(weaponFilter.value !== 'All weapons' && weaponFilter.value.length && !listing.querySelector(`span.img-wrap > span.item-hover > button[aria-label*="${ weaponFilter.value }"]`)) {
          display = false
        }
        if(bonusFilter.value !== 'All bonuses' && bonusFilter.value.length && !listing.querySelector(`div.iconsbonuses span.bonus-attachment-icons[title*="${ bonusFilter.value }"]`)) {
          display = false
        }
        document.querySelectorAll(`.${ ClassAuctionFilter } label.eqa-chk > input`).forEach(chk => {
          const color = chk.getAttribute('eqacolor')
          if(!chk.checked && listing.querySelector(`div:has(span.glow-${color})`)) {
            display = false
          }
        })
        listing.style.display = display ? 'block' : 'none'
      })
    }

    const setVisibility = url => {
      weaponFilter.style.display = 'none'
      bonusFilter.style.display = 'none'
      armorFilter.style.display = 'none'
      filtercont.style.display = 'flex'
      if(isWeapons(url)) {
        armorFilter.value = ''
        weaponFilter.style.display = 'block'
        bonusFilter.style.display = 'block'
      } else if(isArmor(url)) {
        weaponFilter.value = ''
        bonusFilter.value = ''
        armorFilter.style.display = 'block'
      } else {
        weaponFilter.value = ''
        bonusFilter.value = ''
        armorFilter.value = ''
        filtercont.style.display = 'none'
        document.querySelectorAll(`.${ ClassAuctionFilter } label.eqa-chk > input`).forEach(chk => chk.checked = true)
      }
    }

    const form = document.querySelector('div[class*="auction-market-main-cont"] > div[class*="add-listing"] > form')
    form.insertBefore(filtercont, form.querySelector('div[class*="silver"]'))
    document.querySelectorAll(`.${ ClassAuctionFilter } label.eqa-chk > input`).forEach(chk => chk.addEventListener('change', filterListings))
    window.addEventListener('hashchange', e => setVisibility(e.newURL))
    setTimeout(_ => setVisibility(window.location.href), 500)
  }

  const initInventoryFilters = _ => {
    if(document.querySelector(`.${ ClassInventoryFilter }`) || !isInventory() || !isEquipment()) { return }
    let filtercont = document.createElement('div')
    filtercont.classList.add(ClassInventoryFilter);

    ['gray', 'yellow', 'orange', 'red'].forEach(c => {
      let label = document.createElement('label')
      label.classList.add('eqa-chk', c)
      let input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('eqacolor', c)
      input.checked = true
      label.appendChild(input)
      label.appendChild(document.createElement('span'))
      filtercont.appendChild(label)
    })

    let header = document.querySelector('div.main-items-cont-wrap div.items-wrap div[role="heading"]')
    header.insertBefore(filtercont, header.querySelector('form'))
  }

  const addScore = (config, item) => {
    const getScore = (dmg, acc, name) => {
      let score = dmg * acc
      if(RangedWeaponStats[name]) {
        score *= Math.min(RangedWeaponStats[name].ammo * AmmoConservation / (CombatTurns * RangedWeaponStats[name].rof), 1)
      }
      if(MeleeWeaponStats[name]) {
        score *= MeleeWeaponStats[name].bonus
      }
      return parseInt(score)
    }
    const scoreQuality = score => {
      if(score > 5100) return 'artifact'
      if(score > 5000) return 'legendary'
      if(score > 4800) return 'epic'
      if(score > 4400) return 'rare'
      if(score > 3500) return 'uncommon'
      return 'common'
    }

    if(!item.querySelector(config.Damage)) { return }
    const dmg = parseFloat(item.querySelector(config.Damage).textContent)
    const acc = parseFloat(item.querySelector(config.Accuracy).textContent)
    const name = item.querySelector(config.Name).innerText
    const score = getScore(dmg, acc, name)
    if(isNaN(score)) { return }
    let el = document.createElement('div')
    el.classList.add(ClassScore, ClassBar)
    el.appendChild(createElement('div', [scoreQuality(score), 'fill'], `&nbsp;${ score }`))
    item.querySelector(config.DisplayScore).insertAdjacentElement('afterbegin', el)
  }

  const addBonuses = (config, item) => {
    let color = item.querySelector(config.Color).className.match(/glow-([a-z]+)/)?.at(1)
    if(!color) { return }
    const parseBonus = bel => {
      let bb = { name: bel.title.match(/<b>([a-zA-Z0-9\- ]+)<\/b>/)?.at(1) }
      if(!bb.name) { return false }
      let mtch = bel.title.match(/(\d+)%|(\d+)\sturns/)
      bb.value = mtch ? parseInt(bb.name === 'Disarm' ? mtch.at(2) : mtch.at(1)) : 0
      bb.text = bb.name === 'Disarm' ? `${ bb.value }T` : (!bb.value ? '' : mtch.at(0))
      bb.part = getArmorPart(item)
      bb.color = color
      return bb
    }
    const addTooltip = (el, bonus) => {
      if(!EquipmentBonuses[bonus.name]) { l('bad bonus', el, bonus); return }
      let tooltip = createElement('div', ['eqa-thetip'])
      tooltip.appendChild(createElement('div', ['eqa-tooltip-title'], bonus.name))
      let list = createElement('ul')
      if(EquipmentBonuses[bonus.name].yellow) {
        Array.from(['Yellow', 'Orange', 'Red']).forEach(c => {
          let row = createElement('li', [c.toLowerCase()])
          row.appendChild(createElement('div', '', c))
          row.appendChild(createElement('div', '', `${ EquipmentBonuses[bonus.name][c.toLowerCase()].low } - ${ EquipmentBonuses[bonus.name][c.toLowerCase()].high }`))
          list.appendChild(row)
        })
      } else if(EquipmentBonuses[bonus.name][bonus.part]) {
        let row = createElement('li')
        row.appendChild(createElement('div', '', bonus.part))
        row.appendChild(createElement('div', '', `${ EquipmentBonuses[bonus.name][bonus.part].low } - ${ EquipmentBonuses[bonus.name][bonus.part].high }`))
        list.appendChild(row)
      } else if(EquipmentBonuses[bonus.name].low) {
        let row = createElement('li')
        row.appendChild(createElement('div', '', 'All'))
        row.appendChild(createElement('div', '', `${ EquipmentBonuses[bonus.name].low } - ${ EquipmentBonuses[bonus.name].high }`))
        list.appendChild(row)
      }
      tooltip.appendChild(list)
      let wrap = createElement('div', ['eqa-tooltip-wrapper'])
      wrap.appendChild(tooltip)
      el.appendChild(wrap)
    }
    const bonuses = Array.from(item.querySelectorAll(config.Bonuses)).map(b => parseBonus(b)).filter(b => b)
    if(bonuses.length === 2) {
      bonuses.forEach(b => b.value && EquipmentBonuses[b.name] && EquipmentBonuses[b.name][b.color]?.low > b.value && (b.color = { 'red': 'orange', 'orange': 'yellow' }[bonuses[1].color]))
      if(bonuses[1].color === bonuses[0].color && bonuses[0].color !== color) {
        bonuses.toSorted((a, b) => (a.value - EquipmentBonuses[a.name][a.color].low) - (b.value - EquipmentBonuses[b.name][b.color].low)).at(1).color = color
      }
      bonuses.sort((a, b) => a.color.at(-1) > b.color.at(-1) ? 1 : -1)
    }
    bonuses.forEach(b => {
      let el = document.createElement('div')
      el.classList.add(ClassBonus, ClassBar, ClassTooltip)
      addTooltip(el, b)
      let fillel = createElement('div', ['fill'], `&nbsp;&nbsp;${ isWeapons() ? b.name : '' } ${ b.text }`)
      if(EquipmentBonuses[b.name]) {
        const low = EquipmentBonuses[b.name][b.color]?.low || EquipmentBonuses[b.name][b.part]?.low || EquipmentBonuses[b.name].low
        const high = EquipmentBonuses[b.name][b.color]?.high || EquipmentBonuses[b.name][b.part]?.high || EquipmentBonuses[b.name].high
        const fill = clamp((b.value - low) * 100 / (high - low ), 10, 100)
        fillel.style.width = `${ fill }%`
        fillel.classList.add(fill < 25 ? 'gray' : (fill < 50 ? 'yellow' : (fill < 75 ? 'orange' : 'red')))
      }
      el.appendChild(fillel)
      item.querySelector(config.DisplayBonus).appendChild(el)
    })
  }

  const addQuality = async (config, item) => {
    const itemID = _ => isAuction() ? parseInt(item.querySelector('span.item-hover')?.getAttribute('item')) :
                        isInventory() ? parseInt(item.querySelector('ul.actions-wrap > li.left.dump')?.getAttribute('data-item')) : NaN
    const armoryID = _ => isAuction() ? parseInt(item.querySelector('span.item-hover')?.getAttribute('armoury')) :
                          isInventory() ? parseInt(item.querySelector('ul.actions-wrap > li.left.dump')?.getAttribute('data-id')) : NaN
    if(item.querySelector(`div.${ClassQuality}`)) { return }
    const color = item.querySelector(config.Color).className.match(/glow-([a-z]+)/)?.at(1)
    if(!color) { return }
    if(isNaN(itemID()) || isNaN(armoryID())) { return }
    const itemInfo  = await getAction({ type: "post", action: '/page.php?sid=inventory', data: { itemID: itemID(), armouryID: armoryID() } })
    const quality = itemInfo?.extras?.find(e => e.title === 'Quality')?.value
    if(!quality) { return }
    const amount = parseInt(quality.split('%')[0])
    const relAmount = amount - (color === 'orange' ? 100 : (color === 'red' ? 200 : 60))
    let el = document.createElement('div')
    el.classList.add(ClassQuality, ClassBar)
    el.appendChild(createElement('div', [relAmount < 40 ? 'low' : (relAmount < 70 ? 'medium' : 'high'), 'fill'], `&nbsp;${amount}%`))
    item.querySelector(config.DisplayQuality).insertAdjacentElement('afterbegin', el)
  }

  const addMods = (config, item) => {
    if(!config.Mods) { return }
    let cont = document.createElement('div')
    cont.classList.add('eqa-mods')
    item.querySelectorAll(config.Mods).forEach(b => {
      if(b.className.includes('blank-bonus')) {
        return
      }
      const mod = b.title ? b.title.split('</b><br/>')[0].split('<b>')[1] : b.className.split('bonus-attachment-')[1].replace('-', ' ')
      const bonus = b.title ? b.title.split('</b><br/>')[1] : ''
      let el = document.createElement('div')
      el.classList.add('eqa-mod', ClassBar)
      el.appendChild(createElement('div', ['fill'], `${ mod }: ${ bonus }`))
      cont.appendChild(el)
    })
    item.querySelector(config.DisplayQuality).insertAdjacentElement('afterbegin', cont)
  }

  const annotate = _ => {
    Object.values(Configurations).forEach(config => document.querySelectorAll(config.Item).forEach(item => {
      item.firstElementChild.classList.add(ClassAnnotated)
      if(ENABLE_EQUIPMENT_QUALITY) { queueadd(addQuality, [config, item]); item.addEventListener('mouseenter', _ => addQuality(config, item)) }
      if(ENABLE_WEAPON_SCORE)      { addScore(config, item) }
      if(ENABLE_EQUIPMENT_BONUS)   { addBonuses(config, item) }
      if(ENABLE_WEAPON_MODS)       { addMods(config, item) }
    }))
  }

  const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms))

  const waitFor = async condition => {
    for(let i = 0; i < 10; i++) {
      if((typeof condition === 'function' && await condition()) || condition) return true;
      await sleep(250);
    }
    return false;
  }

  const observeList = _ => {
    let listel
    if(isAuction()) {
      listel = document.querySelector('div[id] > div.items-list-wrap > ul.items-list.t-blue-cont.h')
    } else if(isInventory()) {
      listel = document.querySelector('div.items-wrap.primary-items.t-blue-cont')
    }
    if(!listel) { return }
    new MutationObserver(async _ => updateAll()).observe(listel, { childList: true, subtree: true })
  }

  const updateAll = _ => {
    annotate()
    initAuctionFilters()
    auctionPageLoader()
    initInventoryFilters()
  }

  const init = _ => {
    window.addEventListener('hashchange', observeList)
    observeList()
    updateAll()
  }

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  waitFor(_ => document.querySelector('div#sidebarroot')).then(r => init())
})();
