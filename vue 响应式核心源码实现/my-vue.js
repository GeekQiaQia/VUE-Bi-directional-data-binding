/**
 * ES6 class 语法
 *
 * 原生dom 操作，新建文档碎片；并存放在内存中；
 *
 *  数据代理：利用Object.defineProperty(obj,key,cb);
 *
 * */
/**
 * 依赖收集器；所谓依赖，data数据与dom模板之间存在关系；
 * */
class DepCollection{
    constructor(){
       this.deps=[];
    }

    // 添加依赖；
    addDep(dep){
        this.deps.push(dep);
    }

    //当数据修改的以后，通知view层去更新数据；
    notify(){
        console.log('触发修改');
        this.deps.forEach(dep=>{
            dep.update();
        })
    }
}
DepCollection.target=null;

/**
 * 在编译模板的时候，添加watcher;
 * 每一个dep依赖都是一个监听器； 但是可能有一个数据源；比如name数据源；对应有三个依赖；
 * 在data 中的每一个key 都有一个监听器来管理；
 *
 * */
class Watcher{

    constructor(vm,key,callback){
        this.vm=vm;
        this.key=key;
        this.callback=callback;
        this.value=this.get();

    }
    get(){
        // 在此修改Dep.target; 指向我们自身；
        DepCollection.target=this;
        let newValue=this.vm[this.key]
        return newValue;
    }
    update(){

        this.value=this.get();
        console.log(this.value);
        console.log(this.vm);
        this.callback.call(this.vm,this.value);


    }
}

/**
 * compiler
 * 编译 id为el:#app的标签内容，并且将里面的内容进行替换和更新以及属性绑定等操作；；
 *
 * params: el  当前挂载节点；  vm 当前Vue 的实例；
 *
 * */
class Compiler{

    constructor(el,vm){
        // 获取当前实例和节点；
        this.$vm=vm;
        this.$el=document.querySelector(el);
      //  console.log(el,vm);
        // 判断当前的节点是否存在；
        if(this.$el){
          ///  console.log(this.$el);
            //1 把节点内的html 内存存储起来，
            this.$fragment=this.node2Fragment(this.$el);

            //2 编译内部的html;进行属性内容替换以及属性事件绑定；
            this.compileElement(this.$fragment);
            //3 将编译以后的html 替换到当前dom 节点html 以内；
            console.log(this);
            this.$el.appendChild(this.$fragment);
        }
    }

    node2Fragment(domObj){
       // console.log(domObj);
        let fragment=document.createDocumentFragment();
      //  console.log(fragment);
        let child;
        while(child=domObj.firstChild){
        //    console.log(child);
            fragment.appendChild(child)
       //     console.log(fragment);
        }
        return fragment;

    }

    compileElement(elements){

       // console.log(elements);
        let childNodes=elements.childNodes;
        console.log(childNodes);
        Array.from(childNodes).forEach(node=>{
            console.log(node);
            let text=node.textContent;
            console.log(text);

            let reg=/\{\{(.*)\}\}/;
            // 2 如果是dom 节点；判断 v-  @
            if(this.isElementNode(node)){

                this.compile(node);

                //1 如果是文本节点{{}}
            }else if(this.isTextNode(node) && reg.test(text)){
                // 如果是文本节点，
               // console.log(node);
                this.compileText(node,RegExp.$1);
            }
            console.log(node.childNodes);
            if(node.childNodes && node.childNodes.length){
                console.log("into loop");
                this.compileElement(node);
            }


        })

    }
    compile(node){
        // 如果是元素节点，则获取元素节点属性；
        let attrs=node.attributes;
        console.log(attrs);
        Array.from(attrs).forEach(attr=>{
            let attrName=attr.name;
            let value=attr.value;
            console.log(attrName,value);
            // 判断一下标签的属性属于哪一种；
            if(this.isDirective(attrName)){
                // 如果是标签指令 html text model 则排查类型，分别处理；
                let dir=attrName.substring(2);

                // 如果当前函数存在，则执行,params  当前节点， 当前实例；以及当前属性值；
                  this[dir]&&this[dir](node,this.$vm,value)

            }else if(this.isEvent(attrName)){
                let dir=attrName.substring(1);
                this.eventHandler(node,this.$vm,value,dir);
            }

        })

    }
    eventHandler(node,vm,value,dir){
        let fn=vm.$optioins.methods[value];
        if(fn){
            node.addEventListener(dir,fn.bind(vm),false);
        }

    }

    /**
     * 在编译的时候，需要收集依赖，以及监听  使用统一的函数 update来执行完成；
     *
     * */
    html(node,vm,key){
       this.update(node,vm,key,'html');
    }
    model(node,vm,key){
        this.update(node,vm,key,'model');
        // 事件监听
        node.addEventListener('input',e=>{
            let newVal=e.target.value;
            console.log(newVal);
            vm[key]=newVal;
            console.log(vm[key]);

        })

    }
    text(node,vm,key){
        console.log(node,vm,key);
        this.update(node,vm,key,'text');

    }

    update(node,vm,key,dir){
       let updateFun= this[dir+'Updater'];
        updateFun&&updateFun(node,vm[key]);

        // 添加监听器；
        new Watcher(vm,key,function(newValue){
           // 当数据修改的时候，就执行updateFun
            updateFun&&updateFun(node,newValue);
        })


    }
    htmlUpdater(node,value){
        node.innerHTML=value;
    }
    textUpdater(node,value){
        console.log(node,value);
        node.textContent=value;
    }
    modelUpdater(node,value){
        node.value=value;
    }

    isEvent(attrName){

        return attrName.indexOf('@')===0
    }
    isDirective(attrName){
        return attrName.indexOf('v-')===0
    }
    compileText(node,exp){

        console.log(node,exp);
       this.text(node,this.$vm,exp);


    }

    isElementNode(node){


        return node.nodeType==1;
    }
    isTextNode(node){
     //   console.log(node.nodeType);
        return node.nodeType==3;
    }


}


/**
 *
 *
 * */
class Vue{
    // 构造函数
    constructor(options){
        console.log(options);
        this.$data=options.data;
        this.$optioins=options;
        //监听数据用来响应式用函数来取代；
        this.observer(this.$data);
        // 编译模板；
        if(this.$optioins.created){
            options.created.call(this);
        }
        this.$compile=new Compiler(this.$optioins.el,this);

    }

    //实现响应式数据处理,将data 中的所有的key都变成响应式的；
    observer(data){
        console.log(data);
        Object.keys(data).forEach(key=>{
            this.proxyData(key);
            this.defineReactive(data,key,data[key]);
        })
    }
  /**
   * 数据代理，将data属性绑定到this实例中；
   * */
    proxyData(key){
        // 向vue 实例定义key;
        Object.defineProperty(this,key,{
            get(){
                return this.$data[key];
            },
            set(val){
                this.$data[key]=val;
            }
        })
    }

    // 在此函数中真正实现数据响应式处理；
    defineReactive(obj,key,value){

        var dep=new DepCollection();

        Object.defineProperty(obj,key,{
            get(){
                 // 当模板里获取key的时候，获取依赖；
                // data 中的每一个key 都是由 dep 监听器来管理；
                // 添加依赖 目标
                DepCollection.target&&dep.addDep(DepCollection.target);
                return value;
            },
            set(newValue){

                if(newValue===value){
                    return ;
                }
                value=newValue;
                dep.notify();

                //通知页面进行重绘修改内容；

            }
        })
    }

}