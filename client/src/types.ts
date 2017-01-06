namespace Client {
    export enum Animal {
        cat,
        dog
    }

    export enum Role {
        guesser,
        roller
    }

    export enum GameStatus{
        beforePutMouse,
        beforeRolling,
        rolling,
        afterRolling,
        afterGuess,
        roundEnd,
        gameEnd

    }


    export enum UserStatus{
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


    export enum HubPosition{
        top,
        bottom
    }
}