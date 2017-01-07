// addCurrUser(param: userParam) {
//            this.so.emit('enterRoom', param);
//        }

//        addUser(user: User) {

//        }

//        removeUser(username: string) {

//        }


namespace Client {
    export class Pre {
        private stage: egret.Stage;
        private sh: egret.SpriteSheet;

        scene:egret.DisplayObjectContainer;
        private btn: egret.Bitmap;
        private te: egret.TextField;


        private _status: PreStatus;
        public get status(): PreStatus {
            return this._status;
        }
        public set status(v: PreStatus) {
            this._status = v;

            // prepare
            if (v == PreStatus.prepare) {
                this.te.text = '等待其他玩家接入游戏...';
                this.btn.visible = false;
            } else if (v == PreStatus.ready) {
                this.te.text = '请进入游戏';
                this.btn.visible = true;
            }
        }

        constructor(stage: egret.Stage) {
            this.stage = stage;
            this.scene = new egret.DisplayObjectContainer();
            this.stage.addChild(this.scene);

            this.sh = RES.getRes('pre_png');
            this.createScene();

            this.status = PreStatus.prepare;
        }

        createScene() {
            this.createBg();
            this.createLogo();
            this.createBtn();
            this.createTip();
        }

        private createBg() {
            let bg: egret.Bitmap = new egret.Bitmap(this.sh.getTexture('bg_img_jpg'));
            bg.x = this.stage.stageWidth / 2 - bg.width / 2;
            bg.y = this.stage.stageHeight / 2 - bg.height / 2;
            this.scene.addChild(bg);
        }

        private createLogo() {
            let logo: egret.Bitmap = new egret.Bitmap(this.sh.getTexture('logo_png'));
            logo.x = this.stage.stageWidth / 2;
            logo.y = 90;
            logo.scaleX = logo.scaleY = .2;
            logo.anchorOffsetX = logo.width / 2;
            // logo.anchorOffsetY = logo.height/2;
            this.scene.addChild(logo);

            egret.Tween.get(logo)
                .to({ scaleX: 1, scaleY: 1 }, 600, egret.Ease.bounceIn);
        }

        private createBtn() {
            let btn: egret.Bitmap = this.btn = new egret.Bitmap(this.sh.getTexture('btn_png'));
            btn.x = this.stage.stageWidth / 2 - btn.width / 2;
            btn.y = this.stage.stageHeight - 400;
            this.scene.addChild(btn);

            btn.touchEnabled = true;
            btn.addEventListener(egret.TouchEvent.TOUCH_END, () => {
                console.log('prescene btn is clicked');
                let ev: egret.Event = new egret.Event('gameStart',true);
                btn.dispatchEvent(ev);
            }, null);
        }

        private createTip() {
            let te: egret.TextField = this.te = new egret.TextField();
            let widthRate = .8;
            te.width = this.stage.stageWidth * widthRate;
            te.x = this.stage.stageWidth * (1 - widthRate) / 2;
            te.y = this.stage.stageHeight - 160;
            te.textAlign = egret.HorizontalAlign.CENTER;
            this.scene.addChild(te);
        }

    }
}