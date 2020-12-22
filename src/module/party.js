import { FggPartySheet } from "./dialog/party-sheet.js";

export const addControl = (object, html) => {
    let control = `<button class='fgg-party-sheet' type="button" title='${game.i18n.localize('FGG.dialog.partysheet')}'><i class='fas fa-users'></i></button>`;
    html.find(".fas.fa-search").replaceWith($(control))
    html.find('.fgg-party-sheet').click(ev => {
        showPartySheet(object);
    })
}

export const showPartySheet = (object) => {
    event.preventDefault();
    new FggPartySheet(object, {
      top: window.screen.height / 2 - 180,
      left:window.screen.width / 2 - 140,
    }).render(true);
}

export const update = (actor, data) => {
    if (actor.getFlag('fgg', 'party')) {
        Object.values(ui.windows).forEach(w => {
            if (w instanceof FggPartySheet) {
                w.render(true);
            }
        })
    }
}
