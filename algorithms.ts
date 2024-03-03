import {
    DuelPlace,
    move,
    runCommand,
    DuelCommand,
    getInitialState,
    DuelState,
    mergeFragmentToState,
    MoveResult,
    DuelCommandBundle,
} from '@metacraft/murg-engine';
import clone from 'lodash/cloneDeep';

const cache = require('./cache.json');

const findNearestEmptySlot = (duel: DuelState, index: number): number => {
    let nearestIndex = index;

    // before index
    for (let i = index - 1; i >= 0; i--) {
        if (!duel.firstGround[i] && !duel.secondGround[i]) {
            nearestIndex = i;
        } else {
            break;
        }
    }

    // after index
    for (let i = index + 1; i < 11; i++) {
        if (!duel.firstGround[i] && !duel.secondGround[i]) {
            const distanceBefore = index - nearestIndex;
            const distanceAfter = i - index;
            if (distanceAfter < distanceBefore) {
                nearestIndex = i;
            }
            break;
        }
    }

    return nearestIndex;
};

const simulateBotMove = (duel: DuelState): DuelState => { // Cần sửa lại
    const botHand = clone(duel.secondHand);
    const cardToSummon = botHand[0];

    const summonCommand = move.summonCard(duel, {
        from: {
            owner: duel.secondPlayer.id,
            place: DuelPlace.Hand,  
            id: cardToSummon,
        },
        to: {
            owner: duel.secondPlayer.id,
            place: DuelPlace.Ground,
            index: findNearestEmptySlot(duel, 5), 
        },
    });

    const newDualState = clone(duel);
    mergeFragmentToState(newDualState, summonCommand.duel);

    return newDualState;
};




const evaluateDuelState = (duelState: DuelState): number => {
    let score = 0;

    for (const cardId of Object.keys(duelState.stateMap)) {
        const card = duelState.stateMap[cardId];
        if (card.place === DuelPlace.Ground) {
            // check xem trước mặt quân bài có quân bài khác không
            const frontCardId = duelState.firstGround[card.id + 1];
            const backCardId = duelState.firstGround[card.id - 1];
            const frontCard = duelState.stateMap[frontCardId];
            const backCard = duelState.stateMap[backCardId];
            if (!frontCard && !backCard) {
                score += 100;
            }
            score += card.attack + card.defense + card.health;
        }
    }

    score += duelState.firstPlayer.health + duelState.secondPlayer.health;

    return score;
};


const minimax = (node: DuelState, depth: number, alpha: number, beta: number, maxState: boolean): number => {
    if (depth === 0) {
        return evaluateDuelState(node);
    }

    // if (maxState) {
    //     let maxEva = -Infinity;
    //     for (let i = 0; i < node.secondHand.length; i++) {
    //         const childState = clone(node);
    //         const botMove = simulateBotMove(childState);
    //         mergeFragmentToState(childState, botMove.duel);
    //         const eva = minimax(childState, depth - 1, alpha, beta, false);
    //         maxEva = Math.max(maxEva, eva);
    //         alpha = Math.max(alpha, maxEva);
    //         if (beta <= alpha) {
    //             break; //pruning
    //         }
    //     }
    //     return maxEva;

    if (maxState) {
        let maxEva = -Infinity;
        for (let i = 0; i < node.secondHand.length; i++) {
            let childState = clone(node);
            childState = simulateBotMove(childState)
            const eva = minimax(childState, depth - 1, alpha, beta, false);
            maxEva = Math.max(maxEva, eva);
            alpha = Math.max(alpha, maxEva);
            if (beta <= alpha) {
                break; //pruning
            }
        }
        return maxEva;
    } else { // phaanf nafy vaanx chuaw bieets neen xuwr lys sao
        let minEva = +Infinity;
        for (let i = 0; i < node.firstHand.length; i++) {
            const childState = clone(node);
            //chưa xử lý
            const eva = minimax(childState, depth - 1, alpha, beta, true);
            minEva = Math.min(minEva, eva);
            beta = Math.min(beta, minEva);
            if (beta <= alpha) {
                break; //pruning
            }
        }
        return minEva;
    }
};

const selectBestMove = (duel: DuelState, depth: number): DuelState | undefined => {
    let bestScore = -Infinity;
    let bestMove: DuelCommandBundle | undefined;

    for (let i = 0; i < duel.secondHand.length; i++) {
        let childState = clone(duel);
        const botMove = simulateBotMove(childState);
        const score = minimax(botMove, depth - 1, -Infinity, Infinity, false);

        if (score > bestScore) {
            bestScore = score;
            duel = botMove;
        }
    }
    return duel;
};




export const replayWithBot = (depth: number): DuelCommandBundle[] => {
    const duel = getInitialState(cache.config); // Lấy trạng thái ban đầu của trò chơi
    const commandHistory: DuelCommandBundle[] = [];

    let currentDepth = depth; 

    while (true) {
        const botMove = selectBestMove(duel, currentDepth);
        if (!botMove) break;
        commandHistory.push(botMove);// chịu
        mergeFragmentToState(duel, botMove);
        currentDepth--;
    }

    return commandHistory;
};
