namespace Client {
    export interface UserParam {
        gameId: string,
        userId: string,
        username: string,
        ext: {
            logoUrl: string
        }
    }
    export interface UserData {
        id: string;
        name: string;
        logoUrl: string;
        animal: Animal;
        role: Role;
    }

    export enum Animal {
        cat,
        dog
    }

    export enum Role {
        guesser,
        roller
    }

    export enum PreStatus {
        prepare,
        ready
    }

    export enum GameStatus {
        beforeShowMouse,
        beforeHoldMouse,
        afterHoldMouse,
        beforePutMouse,
        beforeRolling,
        rolling,
        afterRolling,
        afterGuess,
        roundEnd,
        gameEnd

    }


    export enum UserStatus {
        // roller
        beforePutMouse,
        beforeRolling,
        rolling,
        afterRolling,

        // guesser
        beforeWatching,
        watching,
        afterWatching,
        afterGuess
    }


    export enum HubPosition {
        top,
        bottom
    }
}