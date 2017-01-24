namespace Client {
    type watchParam = {
        isBind?: boolean
        beWatched: egret.DisplayObject
        eventname: string
        handler: Function
        context: any
        onStatus: string,
        offStatus: string
    };
    export class Binder {

        constructor() {
            this.watchList = [];
        }

        private watchList: watchParam[];
        watch(param: watchParam) {
            param.isBind = param.isBind || false;
            this.watchList.push(param);
        }





        refresh(status) {
            this.watchList.forEach(param => {
                let {isBind, beWatched, eventname, handler, context, onStatus, offStatus} = param;

                if (status == onStatus && !isBind) {
                    console.log(handler+'');
                    beWatched.addEventListener(eventname, handler, context);
                    param.isBind = true;

                } else if (isBind && (status == offStatus || (offStatus == Binder.OTHER_STATUS && status != onStatus))) {
                    beWatched.removeEventListener(eventname, handler, context);
                    param.isBind = false;
                }
            });
        }


        static OTHER_STATUS: string = "other_status";

        static BEWATCHED_TYPE = {
            normal: 'normal',
            stage: 'stage'
        };
    }
}