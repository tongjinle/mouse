namespace Client {
    export let CONFIG = {
        SOCKET_URI:'http://localhost:8080',

        //
        myMouseY:730,
        otherMouseY:400,

        // 最大局数
        maxCount:3,

        // "打开cup藏入老鼠"每一帧的间隔
        OPEN_CUP_SPEED: 80,

        // PUT_MOUSE_DURATION:8,
        // ROLL_DURATION: 6,
        // GUESS_DURATION:5,

        PUT_MOUSE_DURATION:4,
        ROLL_DURATION: 8,
        GUESS_DURATION:5,



        SHOW_MOUSE_TIP:'请把我藏起来',
        SHOW_MOUSE_TIP_DURATION:8000,



        PUT_MOUSE_TIP:'请把老鼠放入一个杯子里',
        PUT_MOUSE_TIP2:'等待别人藏',
        PUT_MOUSE_TIP_DURATION:8000,

        ROLL_TIP:'请摇晃杯子',
        ROLL_TIP2:'等待别人摇',
        ROLL_TIP_DURATION:2000,

        GUESS_MOUSE_TIP:'猜老鼠在哪个杯子',
        GUESS_MOUSE_TIP2:'等待别人猜',
        GUESS_MOUSE_TIP_DURATION:4000,
        
        REST_DURATION:4000,

        // 游戏结束画面出现之前的轮询时间
        GAMEOVER_DURATION:100


    }

}