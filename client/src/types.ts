namespace Client {
    export enum Animal {
        cat,
        dog
    }

    export enum Role {
        guesser,
        roller
    }


    export enum UserStatus{
        // roller
        beforePutMouse,
        beforeRolling,
        rolling,
        afterRoll,
        
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