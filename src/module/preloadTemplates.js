export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Character Sheets
        'systems/fgg/templates/actors/character-html.html',
        'systems/fgg/templates/actors/monster-html.html',
        //Actor partials
        //Sheet tabs
        'systems/fgg/templates/actors/partials/character-header.html',
        'systems/fgg/templates/actors/partials/character-attributes-tab.html',
        'systems/fgg/templates/actors/partials/character-abilities-tab.html',
        'systems/fgg/templates/actors/partials/character-spells-tab.html',
        'systems/fgg/templates/actors/partials/character-inventory-tab.html',
        'systems/fgg/templates/actors/partials/character-notes-tab.html',

        'systems/fgg/templates/actors/partials/monster-header.html',
        'systems/fgg/templates/actors/partials/monster-attributes-tab.html'
    ];
    return loadTemplates(templatePaths);
};
