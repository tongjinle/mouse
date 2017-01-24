namespace Client {
    export class Hand {
        sp: egret.Sprite;
        mc: egret.MovieClip;
        private halo: egret.Bitmap;

        constructor() {
            this.sp = new egret.Sprite();
            this.createAnim();
            // this.createHalo();

            this.sp.visible =false;

        }

        private createAnim() {
            let frames = 3;
            let timer = new egret.Timer(1000 / frames);
            let sh: egret.SpriteSheet = RES.getRes('hand_png');
            let count = 4;
            let index = 0;
            let img = new egret.Bitmap();
            this.sp.addChild(img);

            timer.addEventListener(egret.TimerEvent.TIMER, () => {
                let name = `0${index + 1}_png`;
                img.texture = sh.getTexture(name);
                index = (index + 1) % count;
            }, this);
            timer.start();

           

        }

        private createHalo() {
            let sh: egret.SpriteSheet = RES.getRes('basic_png');

            let halo = this.halo = new egret.Bitmap(sh.getTexture('choise_target_png'));
           
            halo.x = -halo.width / 2;
            halo.y = -halo.height / 2;
            
            this.sp.addChild(halo);
        }

        toggle(isShow:boolean) {
            this.sp.visible = isShow;
        }
    }
}