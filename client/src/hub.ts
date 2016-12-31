namespace Client{
    export class Hub{
        sp:egret.Sprite;
        private bgImg:egret.Bitmap;
        // 决定了要插入的位置
        private index:number;
        // hub的上下位置
        private posi:HubPosition;

        private sh :egret.SpriteSheet;

        constructor(posi:HubPosition){
            this.sh = RES.getRes('basic_png');

            this.index = 0;
            this.posi = posi;
            this.sp = new egret.Sprite();

            this.createBg();
        }

        private createBg(){
            if(HubPosition.top == this.posi){
                this.bgImg = new egret.Bitmap(this.sh.getTexture('enemy_score_bg_png'));

            }else{
                this.bgImg = new egret.Bitmap(this.sh.getTexture('my_score_bg_png'));
            }

            this.sp.addChild(this.bgImg);
            console.log(this.sp.width);
        }

        addScore(isWin:boolean){

        }
    }
}