import Game from '../game';
import User from '../user';
import * as types from '../types';
import * as _ from 'underscore';

interface TestFn {
    (): boolean
}
let testList: TestFn[] = [];


let getGame = () => {
    let gameId = '100';

    let jack = new User();
    jack.name = 'jack';
    jack.id = '100';
    jack.role = types.Role.roll;

    let tom = new User();
    tom.name = 'tom';
    tom.id = '200';
    tom.role = types.Role.guess;

    let userList = [jack, tom];

    return new Game(gameId, userList);
};

let putMouse = (ga: Game) => {
    let userId = _.find(ga.userList, us => us.role == types.Role.roll).id;
    let cupIndex = Math.floor(Math.random() * ga.cupCount);
    ga.putMouse(userId, cupIndex);
};

let guessMouse = (ga: Game, isRight: boolean) => {
    let userId = _.find(ga.userList, us => us.role == types.Role.guess).id;
    let cupIndex: number;
    if (isRight) {
        cupIndex = ga.cupIndex;
    } else {
        for (var i = 0; i < ga.cupCount; i++) {
            if (i != ga.cupIndex) {
                cupIndex = i;
                break;
            }
        }
    }
    ga.guessMouse(userId, cupIndex);
};

// 从先roll方的角度 的 胜负列表
// 1为胜利 0为失败
// 
let runGame = (condi: number[]) => {
    let ga = getGame();
    condi.forEach((n, i) => {
        putMouse(ga);
        guessMouse(ga, i % 2 == 0 ? !(n == 1) : n == 1);

    });
    return ga;

};

// 3个回合结束，jack vs tom -》 2:0， tom还有机会
testList.push(() => {
    let condi = [1, 0, 1];
    let ga: Game = runGame(condi);
    let score = ga.countScore();
    let isOver = ga.isOver;
    return score.normalScoreList[0].join('#') == [1, 1].join('#')
        && score.totalScoreList[0] == 2
        && score.totalScoreList[1] == 1
        && !isOver;
});

// 6个回合结束，jack vs tom -》 2:1， jack胜利
testList.push(() => {
    let condi = [1, 0, 1,1,0,1];
    let ga: Game = runGame(condi);
    let score = ga.countScore();
    let isOver = ga.isOver;
    // console.log(score,isOver,ga.roundCount);
    return score.normalScoreList[0].join('#') == [1, 1].join('#')
        && score.totalScoreList[0] == 2
        && score.totalScoreList[1] == 1
        && isOver;
});

// 4个回合结束，jack已经2:0，所以tom在常规赛没有机会
testList.push(() => {
    let condi = [1, 1, 1, 1];
    let ga: Game = runGame(condi);
    let score = ga.countScore();
    let isOver = ga.isOver;
    return score.normalScoreList[0].join('#') == [1, 1].join('#')
        && score.totalScoreList[0] == 2
        && score.totalScoreList[1] == 0
        && isOver;
});

// 常规赛打平 2:2
// 第一轮加赛1:1
// 第二轮加赛0:0
// 第三轮加赛0:1
// 总分：3:4
// tom胜利
testList.push(() => {
    let condi = [1, 0, 1, 0, 0, 1,/**/1, 0,/**/ 0, 1,/**/ 0, 0];
    let ga: Game = runGame(condi);
    let score = ga.countScore();
    let isOver = ga.isOver;
    console.log(ga.scoreList);
    return score.normalScoreList[0].join('#') == [1, 1].join('#')
        && score.normalScoreList[1].join('#') == [1, 1].join('#')
        && score.addScoreList[0] == 1
        && score.addScoreList[1] == 2

        && score.totalScoreList[0] == 3
        && score.totalScoreList[1] == 4
        && isOver;
});

testList.push(() => {
    let condi = [1, 0, 1, 0, 0, 1,/**/1, 1];
    let ga: Game = runGame(condi);
    let score = ga.countScore();
    let isOver = ga.isOver;
    return score.normalScoreList[0].join('#') == [1, 1].join('#')
        && score.totalScoreList[0] == 3
        && score.totalScoreList[1] == 2
        && isOver;
});



let index=1;
testList/*.slice(index,index+1)*/.forEach((t,i) => console.log(i+'============='+t()));

