namespace Client{
    export class ScoreBoard{
        private sh:egret.SpriteSheet;
        sp:egret.Sprite;

        private userId:string;
        private animal:Animal;
        private isWin:boolean;

        private score:GameScore;
        constructor(userId:string, animal:Animal,score:Client.GameScore,stage:egret.Stage){
            this.sh = RES.getRes('scoreBoard_png');
            this.sp = new egret.Sprite();

            this.sp.width = stage.stageWidth;
            this.sp.height= stage.stageHeight;

            this.userId = userId;
            this.animal = animal;
            this.score = score;
            let wId = this.calWinnerId(score);
            this.isWin = this.userId == wId;

            this.creatScene();
        }

        private calWinnerId(score:Client.GameScore):string{
            let toList = score.totalScoreList;
            let maxScore = _.max(toList);
            let winnerIndex = _.findIndex(toList,sc=>sc==maxScore);
            return score.userIdList[winnerIndex];
        }

        private creatScene(){
            let bg = this.createBigBg();
            bg.x = bg.y = 0;
            this.sp.addChild(bg);

            // let ci = this.createCircle();
            // ci.x = this.sp.width/2 - ci.width/2;
            // this.sp.addChild(ci);

            if(this.isWin){
                let light = this.createLight();
                light.x = this.sp.width/2 - light.width/2;
                light.y = 0;
                this.sp.addChild(light);
            }

            let anim = this.createAnimal();
            anim.x = this.sp.width/2 - anim.width/2;
            anim.y = 100;
            this.sp.addChild(anim);

            let board = this.createBoard();
            board.x = this.sp.width/2 - board.width/2;
            board.y = 300;
            this.sp.addChild(board);

            let backBtn = this.createBackBtn();
            backBtn.x = this.sp.width/2 - backBtn.width/2;
            backBtn.y = this.sp.height-backBtn.height-50;
            this.sp.addChild(backBtn);


            let word = this.createWord();
            word.x = this.sp.width/2 - word.width/2;
            word.y = 640;
            this.sp.addChild(word);

        }

        private createBigBg(){
            return new egret.Bitmap(this.sh.getTexture('bg_jpg'));
        }

        private createLight(){
            let index = 1;
            let count = 6;
            let li = new egret.Bitmap(this.sh.getTexture('w_01_png'));
            let ti = new egret.Timer(500);
            ti.addEventListener(egret.TimerEvent.TIMER,()=>{
                index = (index+1)%count;
                let name = `w_0${index}_png`;
                console.log(name);
                li.texture = this.sh.getTexture(name); 
            },this);
            ti.start();
            return li;
        }

        private createBoard(){
            let name = `${this.isWin?'w':'l'}_bigbg_png`;
            return new egret.Bitmap(this.sh.getTexture(name));
        }

        private createAnimal(){
            return new egret.Bitmap(this.sh.getTexture(`${this.isWin?'w':'l'}_${this.animal == Animal.cat ? 'cat' : 'dog'}_png`));
        }

        private createBackBtn(){
            let name = `back_png`;
            let btn = new egret.Bitmap(this.sh.getTexture(name));
            btn.touchEnabled = true;
            // todo

            return btn;
        }

        private createCircle():egret.Bitmap{
            let bi = new egret.Bitmap(this.sh.getTexture(`${this.isWin?'w':'l'}_bg_png`));
            return bi;
        }

        private createWord(){
            let sp = new egret.Sprite();
            let sc = this.score;
            
            // 常规轮
            let cgl = this.createRowWord('常规轮',sc.normalScoreList.map(n=>n.length));
            cgl.y =0;
            sp.addChild(cgl);
            // 加赛轮
            let jsl = this.createRowWord('加赛轮',sc.addScoreList.length?sc.addScoreList:[0,0]);
            jsl.y =130;
            sp.addChild(jsl);
            // 总计
            let zj = this.createRowWord('总计',sc.totalScoreList);
            zj.y =300;
            sp.addChild(zj);

            return sp;
        }

        private createRowWord(title:string,scoreList:number[]){
            let createText = (str:string,x:number)=>{
                let tf = new egret.TextField();
                tf.text = str;
                tf.fontFamily = 'Microsoft YaHei';
                tf.x = x;
                tf.strokeColor = 0x000000;
                tf.stroke = 3;
                row.addChild(tf);
                return tf;
            };

            let row = new egret.Sprite();
            let tf:egret.TextField;
            tf=createText(title,0);
            tf.textColor = 0xffffff;
            tf.size = 50;

            tf=createText(scoreList[0].toString(),230);
            tf.textColor = 0xCD69C9;
            tf.size = 70;
            
            tf = createText('vs',315);
            tf.textColor = 0xffffff;
            tf.size = 56;
            
            tf=createText(scoreList[1].toString(),430);
            tf.textColor = 0xD2691E;
            tf.size = 70;
            
            return row;
        }
    }












}