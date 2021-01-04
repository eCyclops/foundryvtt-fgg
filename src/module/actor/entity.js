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
      rollParts.push(this.data.data.scores.con.mod);
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
        data.scores.dex.mod.toString(),
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
    data.aac.naked = baseAac + data.scores.dex.mod;
    data.ac.naked = baseAc - data.scores.dex.mod;
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
    data.aac.value = baseAac + data.scores.dex.mod + AacShield + data.aac.mod;
    data.ac.value = baseAc - data.scores.dex.mod - AcShield - data.ac.mod;
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
    data.scores.dex.mod = FggActor._valueFromTable(
      standard,
      data.scores.dex.value
    );
    data.scores.con.mod = FggActor._valueFromTable(
      standard,
      data.scores.con.value
    );
    data.scores.int.mod = FggActor._valueFromTable(
      standard,
      data.scores.int.value
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
