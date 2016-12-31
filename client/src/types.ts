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
        rolling,
        afterRoll,
        
        // guesser
        beforeWatching,
        watching,
        afterWatching,
        afterGuess
    }
}