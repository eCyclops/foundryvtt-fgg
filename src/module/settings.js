export const registerSettings = function () {

  game.settings.register("fgg", "initiative", {
    name: game.i18n.localize("FGG.Setting.Initiative"),
    hint: game.i18n.localize("FGG.Setting.InitiativeHint"),
    default: "group",
    scope: "world",
    type: String,
    config: true,
    choices: {
      individual: "FGG.Setting.InitiativeIndividual",
      group: "FGG.Setting.InitiativeGroup",
    },
    onChange: _ => window.location.reload()
  });

  game.settings.register("fgg", "rerollInitiative", {
    name: game.i18n.localize("FGG.Setting.RerollInitiative"),
    hint: game.i18n.localize("FGG.Setting.RerollInitiativeHint"),
    default: "reset",
    scope: "world",
    type: String,
    config: true,
    choices: {
      keep: "FGG.Setting.InitiativeKeep",
      reset: "FGG.Setting.InitiativeReset",
      reroll: "FGG.Setting.InitiativeReroll",
    }
  });

  game.settings.register("fgg", "ascendingAC", {
    name: game.i18n.localize("FGG.Setting.AscendingAC"),
    hint: game.i18n.localize("FGG.Setting.AscendingACHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.settings.register("fgg", "morale", {
    name: game.i18n.localize("FGG.Setting.Morale"),
    hint: game.i18n.localize("FGG.Setting.MoraleHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
  });

  game.settings.register("fgg", "encumbranceOption", {
    name: game.i18n.localize("FGG.Setting.Encumbrance"),
    hint: game.i18n.localize("FGG.Setting.EncumbranceHint"),
    default: "detailed",
    scope: "world",
    type: String,
    config: true,
    choices: {
      disabled: "FGG.Setting.EncumbranceDisabled",
      basic: "FGG.Setting.EncumbranceBasic",
      detailed: "FGG.Setting.EncumbranceDetailed",
      complete: "FGG.Setting.EncumbranceComplete",
    },
    onChange: _ => window.location.reload()
  });

  game.settings.register("fgg", "significantTreasure", {
    name: game.i18n.localize("FGG.Setting.SignificantTreasure"),
    hint: game.i18n.localize("FGG.Setting.SignificantTreasureHint"),
    default: 800,
    scope: "world",
    type: Number,
    config: true,
    onChange: _ => window.location.reload()
  });
};
