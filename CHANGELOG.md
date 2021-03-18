# Changelog
All notable changes to this project will be documented in this file.

## [0.0.20] - 2020-12-28
### Added
### Changed
- Reordered attributes to match FGG standard
- Renamed saving throws to FGG standard (via English localization anyway)
- Changed readme and chat message to reflect FGG over old OSE references
- Changed ose tags in code to ffg tags (where found so far)
### Removed
- package files for old OSE repo

## [0.0.21 - 0.0.23] - 2020-12-30
### Added
### Changed
- Saving throws genertated for Monster sheets now match FG&G values
### Removed
- Final display for character creation dialogue, this has bypassed the bug that stopped this window from closing

## [0.0.24] - 2021-01-02
### Added
- .db files for armor, equipment, non-combat skills, weapons and wizard spells for compendium
### Changed
- system.json to inititate compendium packs
### Removed

## [0.0.25] - 2021-01-03
### Added
### Changed
- Strength melee modifiers now use the correct attack and damage adjustments for FG&G (excluding fighter exceptional Strength)
### Removed

## [0.0.26-0.0.32] - 2021-01-08
### Added
### Changed
- Modifier dialogue now shows all the correct modifiers except Wis spell immunities
### Removed
- Languages from OSE which are not part of FG&G (e.g. alignment languages and some racial languages)

## [0.0.33]
### Added
- Updated weapon items to include speed, damage type and large damage dice (not implemented in the roller yet)
### Changed
### Removed

## [0.0.34]
### Added
- A new tab for NCS (to distinguish from class/race abilities)
### Changed
- fixed a bug stopping the sheet from opening
### Removed

## [0.0.35-36]
### Added
### Changed
- altered encumbrance, it's still not perfect but closer to the expected result (currently aligns to 1e)
- fixed AC max and minimums as was set between -3 to 9, now -10 to 10 in line with FGG
### Removed
- removed NCS tab as could not get this functionality to work at this time

## [0.0.37]
### Added
### Changed
- changed morale to a 2d10 roll in line with FGG
- altered AC max and minimums, now -20 to 10 to allow more cross compatibility
### Removed
