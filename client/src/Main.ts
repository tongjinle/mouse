//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
/// <reference path="../libs/socketio/socket.io.d.ts" />

class Main extends egret.DisplayObjectContainer {
    private currUser: Client.UserParam;
    private userList: Client.User[];
    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView: LoadingUI;
    public constructor() {
        super();
        this.userList = [];
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event: egret.Event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        this.bind();


        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event: RES.ResourceEvent): void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event: RES.ResourceEvent): void {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);

            this.createSocket();
            this.createPreScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event: RES.ResourceEvent): void {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event: RES.ResourceEvent): void {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event: RES.ResourceEvent): void {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }



    private mockUserList(): Client.User[] {
        let userList: Client.User[] = [];
        let u: Client.User;
        u = new Client.User('100', 'dino', Client.Animal.dog, Client.Role.guesser);
        u.logoUrl = './resource/assets/u1.jpeg';
        userList.push(u);

        u = new Client.User('200', 'xia', Client.Animal.cat, Client.Role.roller);
        u.logoUrl = './resource/assets/u2.jpeg';
        // u.logoUrl = 'http://www.easyicon.net/api/resizeApi.php?id=1196559&size=128';
        userList.push(u);

        return userList;
    }

    private pre: Client.Pre;
    private createPreScene(): void {
        let pre = this.pre = new Client.Pre(this.stage);

        
    }


    private game: Client.Game;

    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene(): void {
        // let userList: Client.User[] = this.mockUserList();
        let currUserId = this.currUser.userId;
        let game = this.game = new Client.Game(this.stage, this.userList, currUserId);
        // game.userList = this.userList;
        // game.currUser = _.find(this.userList,us=>us.userId == this.currUser.userId);
        game.createSocket(this.so);
        // game.bind();
        game.start();

          // mock
        // let ev = new egret.Event('gameStart');
        // this.stage.dispatchEvent(ev)

    }

    // url格式:
    // ?username=1&userId=100&gameId=100&ext_logoUrl=http://abc.com
    private getCurrUser(): Client.UserParam {
        let search = location['search'] as string;
        return Client.UrlParser.parseSearch(search);
    }

    private so: SocketIOClient.Socket;
    private createSocket() {
        let so = this.so = io(Client.CONFIG.SOCKET_URI);
        so.on('onenterRoom', (data: Client.UserParam) => {
            console.log('onenterRoom', data);

            this.pre.status = Client.PreStatus.ready;
        });

        so.on('onleaveRoom', (data: { userId: string }) => {
            console.log('onleaveRoom', data);
            _.find(this.userList, (us, i) => {
                if (us.userId == data.userId) {
                    this.userList.splice(i, 1);
                    return true;
                }
            });
            so.disconnect();
            // this.checkPreStatus();
        });

        so.on('ongameStart', (data: { userList: Client.UserData[] }) => {
            this.userList = data.userList.map(us => {
                let {id, name, animal, role, logoUrl} = us;
                let user = new Client.User(id, name, animal, role);
                user.logoUrl = logoUrl;
                return user;
            });

            console.log(this.userList);

            this.pre.scene.visible = false;
            this.createGameScene();
        });

       
    }


    private bind() {
        this.stage.addEventListener('gameStart', () => {
            console.log('gamestart in main');
            this.enterRoom();
            
        }, null);
      
    }


    // 进入房间
    private enterRoom(){
        let currUser = this.currUser = this.getCurrUser();
        if (!currUser) {
            throw "invaild UserParam";
        }

        this.so.emit('enterRoom', currUser);
    }
}


