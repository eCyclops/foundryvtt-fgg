import { FggDice } from "../dice.js";

export class FggActor extends Actor {
  /**
   * Extends data from base Actor class
   */

  prepareData() {
    super.prepareData();
    const data = this.data.data;

    // Compute modifiers from actor scores
    this.computeModifiers();
    this._isSlow();
    this.computeAC();
    this.computeEncumbrance();
    this.computeTreasure();

    // Determine Initiative
    if (game.settings.get("fgg", "initiative") != "group") {
      data.initiative.value = data.initiative.mod;
      if (this.data.type == "character") {
        data.initiative.value += data.scores.dex.mod;
      }
    } else {
      data.initiative.value = 0;
    }
    data.movement.encounter = data.movement.base / 3;
  }
  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
    /* -------------------------------------------- */
  getExperience(value, options = {}) {
    if (this.data.type != "character") {
      return;
    }
    let modified = Math.floor(
      value + (this.data.data.details.xp.bonus * value) / 100
    );
    return this.update({
      "data.details.xp.value": modified + this.data.data.details.xp.value,
    }).then(() => {
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        content: game.i18n.format("FGG.messages.GetExperience", {
          name: this.name,
          value: modified,
        }),
        speaker,
      });
    });
  }

  isNew() {
    const data = this.data.data;
    if (this.data.type == "character") {
      let ct = 0;
      Object.values(data.scores).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    } else if (this.data.type == "monster") {
      let ct = 0;
      Object.values(data.saves).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    }
  }

  generateSave(hd) {
    let saves = {};
    for (let i = 0; i <= hd; i++) {
      let tmp = CONFIG.FGG.monster_saves[i];
      if (tmp) {
        saves = tmp;
      }
    }
    this.update({
      "data.saves": {
        death: {
          value: saves.d,
        },
        wand: {
          value: saves.w,
        },
        paralysis: {
          value: saves.p,
        },
        breath: {
          value: saves.b,
        },
        spell: {
          value: saves.s,
        },
      },
    });
  }

  /* -------------------------------------------- */
  /*  Rolls                                       */
  /* -------------------------------------------- */

  rollHP(options = {}) {
    let roll = new Roll(this.data.data.hp.hd).roll();
    return this.update({
      data: {
        hp: {
          max: roll.total,
          value: roll.total,
        },
      },
    });
  }

  rollSave(save, options = {}) {
    const label = game.i18n.localize(`FGG.saves.${save}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.data,
      roll: {
        type: "above",
        target: this.data.data.saves[save].value,
        magic: this.data.type === "character" ? this.data.data.scores.wis.mod : 0,
      },
      details: game.i18n.format("FGG.roll.details.save", { save: label }),
    };

    let skip = options.event && options.event.ctrlKey;

    const rollMethod = this.data.type == "character" ? FggDice.RollSave : FggDice.Roll;

    // Roll and return
    return rollMethod({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("FGG.roll.save", { save: label }),
      title: game.i18n.format("FGG.roll.save", { save: label }),
    });
  }

  rollMorale(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.details.morale,
      },
    };

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("FGG.roll.morale"),
      title: game.i18n.localize("FGG.roll.morale"),
    });
  }

  rollLoyalty(options = {}) {
    const label = game.i18n.localize(`FGG.roll.loyalty`);
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.retainer.loyalty,
      },
    };

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollReaction(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "table",
        table: {
          2: game.i18n.format("FGG.reaction.Hostile", {
            name: this.data.name,
          }),
          3: game.i18n.format("FGG.reaction.Unfriendly", {
            name: this.data.name,
          }),
          6: game.i18n.format("FGG.reaction.Neutral", {
            name: this.data.name,
          }),
          9: game.i18n.format("FGG.reaction.Indifferent", {
            name: this.data.name,
          }),
          12: game.i18n.format("FGG.reaction.Friendly", {
            name: this.data.name,
          }),
        },
      },
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("FGG.reaction.check"),
      title: game.i18n.localize("FGG.reaction.check"),
    });
  }

  rollCheck(score, options = {}) {
    const label = game.i18n.localize(`FGG.scores.${score}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.data,
      roll: {
        type: "check",
        target: this.data.data.scores[score].value,
      },

      details: game.i18n.format("FGG.roll.details.attribute", {
        score: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("FGG.roll.attribute", { attribute: label }),
      title: game.i18n.format("FGG.roll.attribute", { attribute: label }),
    });
  }

  rollHitDice(options = {}) {
    const label = game.i18n.localize(`FGG.roll.hd`);
    const rollParts = [this.data.data.hp.hd];
    if (this.data.type == "character") {
      rollParts.push(this.data.data.scores.con.hpmod);
    }

    const data = {
      actor: this.data,
      roll: {
        type: "hitdice",
      },
    };

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollAppearing(options = {}) {
    const rollParts = [];
    let label = "";
    if (options.check == "wilderness") {
      rollParts.push(this.data.data.details.appearing.w);
      label = "(2)";
    } else {
      rollParts.push(this.data.data.details.appearing.d);
      label = "(1)";
    }
    const data = {
      actor: this.data,
      roll: {
        type: {
          type: "appearing",
        },
      },
    };

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("FGG.roll.appearing", { type: label }),
      title: game.i18n.format("FGG.roll.appearing", { type: label }),
    });
  }

  rollExploration(expl, options = {}) {
    const label = game.i18n.localize(`FGG.exploration.${expl}.long`);
    const rollParts = ["1d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.exploration[expl],
      },
      details: game.i18n.format("FGG.roll.details.exploration", {
        expl: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("FGG.roll.exploration", { exploration: label }),
      title: game.i18n.format("FGG.roll.exploration", { exploration: label }),
    });
  }

  rollDamage(attData, options = {}) {
    const data = this.data.data;

    const rollData = {
      actor: this.data,
      item: attData.item,
      roll: {
        type: "damage",
      },
    };

    let dmgParts = [];
    if (!attData.roll.dmg) {
      dmgParts.push("1d6");
    } else {
      dmgParts.push(attData.roll.dmg);
    }

    // Add Str to damage
    if (attData.roll.type == "melee") {
      dmgParts.push(data.scores.str.dmg);
    }

    // Damage roll
    FggDice.Roll({
      event: options.event,
      parts: dmgParts,
      data: rollData,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${attData.label} - ${game.i18n.localize("FGG.Damage")}`,
      title: `${attData.label} - ${game.i18n.localize("FGG.Damage")}`,
    });
  }

  async targetAttack(data, type, options) {
    if (game.user.targets.size > 0) {
      for (let t of game.user.targets.values()) {
        data.roll.target = t;
        await this.rollAttack(data, {
          type: type,
          skipDialog: options.skipDialog,
        });
      }
    } else {
      this.rollAttack(data, { type: type, skipDialog: options.skipDialog });
    }
  }

  rollAttack(attData, options = {}) {
    const data = this.data.data;
    const rollParts = ["1d20"];
    const dmgParts = [];
    let label = game.i18n.format("FGG.roll.attacks", {
      name: this.data.name,
    });
    if (!attData.item) {
      dmgParts.push("1d6");
    } else {
      label = game.i18n.format("FGG.roll.attacksWith", {
        name: attData.item.name,
      });
      dmgParts.push(attData.item.data.damage);
    }

    let ascending = game.settings.get("fgg", "ascendingAC");
    if (ascending) {
      rollParts.push(data.thac0.bba.toString());
    }
    if (options.type == "missile") {
      rollParts.push(
        data.scores.dex.reactmiss.toString(),
        data.thac0.mod.missile.toString()
      );
    } else if (options.type == "melee") {
      rollParts.push(
        data.scores.str.atk.toString(),
        data.thac0.mod.melee.toString()
      );
    }
    if (attData.item && attData.item.data.bonus) {
      rollParts.push(attData.item.data.bonus);
    }
    let thac0 = data.thac0.value;
    if (options.type == "melee") {
      dmgParts.push(data.scores.str.dmg);
    }
    const rollData = {
      actor: this.data,
      item: attData.item,
      roll: {
        type: options.type,
        thac0: thac0,
        dmg: dmgParts,
        save: attData.roll.save,
        target: attData.roll.target,
      },
    };

    // Roll and return
    return FggDice.Roll({
      event: options.event,
      parts: rollParts,
      data: rollData,
      skipDialog: options.skipDialog,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  async applyDamage(amount = 0, multiplier = 1) {
    amount = Math.floor(parseInt(amount) * multiplier);
    const hp = this.data.data.hp;

    // Remaining goes to health
    const dh = Math.clamped(hp.value - amount, 0, hp.max);

    // Update the Actor
    return this.update({
      "data.hp.value": dh,
    });
  }

  static _valueFromTable(table, val) {
    let output;
    for (let i = 0; i <= val; i++) {
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  _isSlow() {
    this.data.data.isSlow = false;
    if (this.data.type != "character") {
      return;
    }
    this.data.items.forEach((item) => {
      if (item.type == "weapon" && item.data.slow && item.data.equipped) {
        this.data.data.isSlow = true;
        return;
      }
    });
  }

  computeEncumbrance() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;
    let option = game.settings.get("fgg", "encumbranceOption");

    // Compute encumbrance
    let totalWeight = 0;
    let hasItems = false;
    Object.values(this.data.items).forEach((item) => {
      if (item.type == "item" && !item.data.treasure) {
        hasItems = true;
      }
      if (
        item.type == "item" &&
        (["complete", "disabled"].includes(option) || item.data.treasure)
      ) {
        totalWeight += item.data.quantity.value * item.data.weight;
      } else if (option != "basic" && ["weapon", "armor"].includes(item.type)) {
        totalWeight += item.data.weight;
      }
    });
    if (option === "detailed" && hasItems) totalWeight += 80;

    data.encumbrance = {
      pct: Math.clamped(
        (100 * parseFloat(totalWeight)) / data.encumbrance.max,
        0,
        100
      ),
      max: data.encumbrance.max,
      encumbered: totalWeight > data.encumbrance.max,
      value: totalWeight,
    };

    if (data.config.movementAuto && option != "disabled") {
      this._calculateMovement();
    }
  }

  _calculateMovement() {
    const data = this.data.data;
    let option = game.settings.get("fgg", "encumbranceOption");
    let weight = data.encumbrance.value;
    let delta = data.encumbrance.max - 1600;
    if (["detailed", "complete"].includes(option)) {
      if (weight > data.encumbrance.max) {
        data.movement.base = 0;
      } else if (weight > 800 + delta) {
        data.movement.base = 30;
      } else if (weight > 600 + delta) {
        data.movement.base = 60;
      } else if (weight > 400 + delta) {
        data.movement.base = 90;
      } else {
        data.movement.base = 120;
      }
    } else if (option == "basic") {
      const armors = this.data.items.filter((i) => i.type == "armor");
      let heaviest = 0;
      armors.forEach((a) => {
        if (a.data.equipped) {
          if (a.data.type == "light" && heaviest == 0) {
            heaviest = 1;
          } else if (a.data.type == "heavy") {
            heaviest = 2;
          }
        }
      });
      switch (heaviest) {
        case 0:
          data.movement.base = 120;
          break;
        case 1:
          data.movement.base = 90;
          break;
        case 2:
          data.movement.base = 60;
          break;
      }
      if (weight > game.settings.get("fgg", "significantTreasure")) {
        data.movement.base -= 30;
      }
    }
  }

  computeTreasure() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;
    // Compute treasure
    let total = 0;
    let treasure = this.data.items.filter(
      (i) => i.type == "item" && i.data.treasure
    );
    treasure.forEach((item) => {
      total += item.data.quantity.value * item.data.cost;
    });
    data.treasure = total;
  }

  computeAC() {
    if (this.data.type != "character") {
      return;
    }
    // Compute AC
    let baseAc = 10;
    let baseAac = 10;
    let AcShield = 0;
    let AacShield = 0;
    const data = this.data.data;
    data.aac.naked = baseAac - data.scores.dex.defadj;
    data.ac.naked = baseAc + data.scores.dex.defadj;
    const armors = this.data.items.filter((i) => i.type == "armor");
    armors.forEach((a) => {
      if (a.data.equipped && a.data.type != "shield") {
        baseAc = a.data.ac.value;
        baseAac = a.data.aac.value;
      } else if (a.data.equipped && a.data.type == "shield") {
        AcShield = a.data.ac.value;
        AacShield = a.data.aac.value;
      }
    });
    data.aac.value = baseAac - data.scores.dex.defadj - AacShield - data.aac.mod;
    data.ac.value = baseAc + data.scores.dex.defadj + AcShield + data.ac.mod;
    data.ac.shield = AcShield;
    data.aac.shield = AacShield;
  }

  computeModifiers() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;

    const standard = {
      0: -3,
      3: -3,
      4: -2,
      6: -1,
      9: 0,
      13: 1,
      16: 2,
      18: 3,
    };
    const strattack = {
     0: -5,
     2: -3,
     4: -2,
     6: -1,
     8: 0,
     17: 1,
     19: 3,
     21: 4,
     23: 5,
     24: 6,
     25: 7,
    };
    const strdamage = {
     0: -4,
     2: -2,
     3: -1,
     6: 0,
     16: 1,
     18: 2,
     19: 7,
     20: 8,
     21: 9,
     22: 10,
     23: 11,
     24: 12,
     25: 14,
    };
    data.scores.str.mod = FggActor._valueFromTable(
      standard,
      data.scores.str.value
    );
    data.scores.str.atk = FggActor._valueFromTable(
      strattack,
      data.scores.str.value
    );
    data.scores.str.dmg = FggActor._valueFromTable(
      strdamage,
      data.scores.str.value
    );
    const nonencum = {
     0: 0,
     1: 1,
     2: 5,
     3: 5,
     4: 10,
     6: 20,
     8: 35,
     10: 40,
     12: 45,
     14: 55,
     16: 70,
     17: 85,
     18: 110,
     19: 485,
     20: 535,
     21: 635,
     22: 785,
     23: 935,
     24: 1235,
     25: 1535,
    };
    data.scores.str.nonencum = FggActor._valueFromTable(
      nonencum,
      data.scores.str.value
    );
    const maxweight = {
     0: 0,
     1: 3,
     2: 5,
     3: 10,
     4: 20,
     6: 55,
     8: 90,
     10: 115,
     12: 135,
     14: 165,
     16: 180,
     17: 220,
     18: 255,
     19: 640,
     20: 700,
     21: 810,
     22: 970,
     23: 1130,
     24: 1440,
     25: 1750,
    };
    data.scores.str.maxweight = FggActor._valueFromTable(
      maxweight,
      data.scores.str.value
    );
    const fd = {
     0: 0,
     1: 1,
     2: 1,
     3: 2,
     4: 3,
     6: 4,
     8: 5,
     10: 6,
     12: 7,
     14: 8,
     16: 9,
     17: 10,
     18: 11,
     19: 16,
     20: 17,
     21: 17,
     22: 18,
     23: 18,
     24: 19,
     25: 19,
    };
    data.scores.str.fd = FggActor._valueFromTable(
      fd,
      data.scores.str.value
    );
    const bendlift = {
     0: 0,
     6: 0,
     8: 1,
     10: 2,
     12: 4,
     14: 7,
     16: 10,
     17: 13,
     18: 16,
     19: 50,
     20: 60,
     21: 70,
     22: 80,
     23: 90,
     24: 95,
     25: 99,
    };
    data.scores.str.bendlift = FggActor._valueFromTable(
      bendlift,
      data.scores.str.value
    );
    const reactmiss = {
     0: -6,
     2: -4,
     3: -3,
     4: -2,
     5: -1,
     6: 0,
     16: 1,
     17: 2,
     19: 3,
     21: 4,
     24: 5,
    };
    data.scores.dex.reactmiss = FggActor._valueFromTable(
      reactmiss,
      data.scores.dex.value
    );
    const dexdef = {
     0: 5,
     3: 4,
     4: 3,
     5: 2,
     6: 1,
     7: 0,
     15: -1,
     16: -2,
     17: -3,
     18: -4,
     21: -5,
     24: -6,
    };
    data.scores.dex.defadj = FggActor._valueFromTable(
      dexdef,
      data.scores.dex.value
    );
        data.scores.dex.mod = FggActor._valueFromTable(
      standard,
      data.scores.dex.value
    );
    const hpmod = {
     0: -3,
     1: -3,
     2: -2,
     4: -1,
     7: 0,
     15: 1,
     16: 2,
    };
    data.scores.con.hpmod = FggActor._valueFromTable(
      hpmod,
      data.scores.con.value
    );
    const systemshock = {
     0: 0,
     1: 25,
     2: 30,
     3: 35,
     4: 40,
     5: 45,
     6: 50,
     7: 55,
     8: 60,
     9: 65,
     10: 70,
     11: 75,
     12: 80,
     13: 85,
     14: 88,
     15: 90,
     16: 95,
     17: 97,
     18: 99,
     25: 100,
    };
    data.scores.con.systemshock = FggActor._valueFromTable(
      systemshock,
      data.scores.con.value
    );
    const resurrectionchance = {
     0: 0,
     1: 30,
     2: 35,
     3: 40,
     4: 45,
     5: 50,
     6: 55,
     7: 60,
     8: 65,
     9: 70,
     10: 75,
     11: 80,
     12: 85,
     13: 90,
     14: 92,
     15: 94,
     16: 96,
     17: 98,
     18: 100,
    };
    data.scores.con.resurrectionchance = FggActor._valueFromTable(
      resurrectionchance,
      data.scores.con.value
    );
    const poisonresist = {
     0: -2,
     1: -2,
     2: -1,
     3: 0,
     19: 1,
     21: 2,
     23: 3,
     25: 4,
    };
    data.scores.con.poisonresist = FggActor._valueFromTable(
      poisonresist,
      data.scores.con.value
    );
    const regeneration = {
     0: 0,
     20: 6,
     21: 5,
     22: 4,
     23: 3,
     24: 2,
     25: 1,
    };
    data.scores.con.regeneration = FggActor._valueFromTable(
      regeneration,
      data.scores.con.value
    );
    data.scores.con.mod = FggActor._valueFromTable(
      standard,
      data.scores.con.value
    );
    const languagesknown = {
     0: 0,
     2: 1,
     9: 2,
     12: 3,
     14: 4,
     16: 5,
     17: 6,
     18: 7,
     19: 8,
     20: 9,
     21: 10,
     22: 11,
     23: 12,
     24: 15,
     25: 20,
    };
    data.scores.int.languagesknown = FggActor._valueFromTable(
      languagesknown,
      data.scores.int.value
    );
    const maxspelllevel = {
     0: 0,
     9: 4,
     10: 5,
     12: 6,
     14: 7,
     16: 8,
     18: 9,
    };
    data.scores.int.maxspelllevel = FggActor._valueFromTable(
      maxspelllevel,
      data.scores.int.value
    );
    const maxnumber = {
     0: 0,
     9: 6,
     10: 7,
     13: 9,
     15: 11,
     17: 14,
     18: 18,
     19: 24,
     20: 30,
    };
    const learnspell = {
     0: 0,
     9: 35,
     10: 40,
     11: 45,
     12: 50,
     13: 55,
     14: 60,
     15: 65,
     16: 70,
     17: 75,
     18: 85,
     19: 95,
     20: 96,
     21: 97,
     22: 98,
     23: 99,
     24: 100,
    };
    data.scores.int.learnspell = FggActor._valueFromTable(
      learnspell,
      data.scores.int.value
    );
    const illusionimmunity = {
     0: 0,
     19: 1,
     20: 2,
     21: 3,
     22: 4,
     23: 5,
     24: 6,
     25: 7,
    };
    data.scores.int.illusionimmunity = FggActor._valueFromTable(
      illusionimmunity,
      data.scores.int.value
    );
    data.scores.int.maxnumber = FggActor._valueFromTable(
      maxnumber,
      data.scores.int.value
    );
    data.scores.int.mod = FggActor._valueFromTable(
      standard,
      data.scores.int.value
    );
    const mentaldefence = {
     0: -6,
     1: -6,
     2: -4,
     3: -3,
     4: -2,
     5: -1,
     8: 0,
     15: 1,
     16: 2,
     17: 3,
     18: 4,
    };
    data.scores.wis.mentaldefence = FggActor._valueFromTable(
      mentaldefence,
      data.scores.wis.value
    );
    const bonusspells = {
     0: "0",
     13: "1x1st",
     14: "2x1st",
    };
    data.scores.wis.bonusspells = FggActor._valueFromTable(
      bonusspells,
      data.scores.wis.value
    );
    const spellfailure = {
     0: 100,
     1: 80,
     2: 60,
     3: 50,
     4: 45,
     5: 40,
     6: 35,
     7: 30,
     8: 25,
     9: 20,
     10: 15,
     11: 10,
     12: 5,
     13: 0,
    };
    data.scores.wis.spellfailure = FggActor._valueFromTable(
      spellfailure,
      data.scores.wis.value
    );

    data.scores.wis.mod = FggActor._valueFromTable(
      standard,
      data.scores.wis.value
    );
    data.scores.cha.mod = FggActor._valueFromTable(
      standard,
      data.scores.cha.value
    );

    const capped = {
      0: -2,
      3: -2,
      4: -1,
      6: -1,
      9: 0,
      13: 1,
      16: 1,
      18: 2,
    };
    data.scores.dex.init = FggActor._valueFromTable(
      capped,
      data.scores.dex.value
    );
    data.scores.cha.npc = FggActor._valueFromTable(
      capped,
      data.scores.cha.value
    );
    data.scores.cha.retain = data.scores.cha.mod + 4;
    data.scores.cha.loyalty = data.scores.cha.mod + 7;

    const od = {
      0: 0,
      3: 1,
      9: 2,
      13: 3,
      16: 4,
      18: 5,
    };
    data.exploration.odMod = FggActor._valueFromTable(
      od,
      data.scores.str.value
    );

    const literacy = {
      0: "",
      3: "FGG.Illiterate",
      6: "FGG.LiteracyBasic",
      9: "FGG.Literate",
    };
    data.languages.literacy = FggActor._valueFromTable(
      literacy,
      data.scores.int.value
    );

    const spoken = {
      0: "FGG.NativeBroken",
      3: "FGG.Native",
      13: "FGG.NativePlus1",
      16: "FGG.NativePlus2",
      18: "FGG.NativePlus3",
    };
    data.languages.spoken = FggActor._valueFromTable(
      spoken,
      data.scores.int.value
    );
  }
}
