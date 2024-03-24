import {
    defaultSetting,
    DuelConfig,
    getInitialState,
    makeMeta,
    DuelState,
    move,
    PlayerConfig,
    DuelCommandBundle,
    mergeFragmentToState
} from '@metacraft/murg-engine';

import { generateRandomDeck } from '../util/deck';

export const getState = (id: string, history: DuelCommandBundle, version = '00001'): DuelState => {
    const meta = makeMeta(version);
    const firstPlayer: PlayerConfig = {
        id: 'A',
        deck: generateRandomDeck(meta),
    };
    const secondPlayer: PlayerConfig = {
        id: 'B',
        deck: generateRandomDeck(meta),
    };
    const config: DuelConfig = {
        version,
        setting: defaultSetting,
        firstMover: firstPlayer.id,
        firstPlayer: firstPlayer,
        secondPlayer: secondPlayer,
    };
    const state = getInitialState({
        version,
        setting: config.setting,
        firstMover: firstPlayer.id,
        firstPlayer: config.firstPlayer,
        secondPlayer: config.secondPlayer,
    });
    mergeFragmentToState(state, history)
    console.log("1 vài demo",state.firstGround)
    return state
};