"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// 对象合并方法
function assign(a, b) {
  var newObj = {};

  for (var key in a) {
    newObj[key] = a[key];
  }

  for (var key in b) {
    newObj[key] = b[key];
  }

  return newObj;
} // 运行页面所属的方法


function runPageFunction(pageName, entryDom) {
  // ozzx-name处理
  window.ozzx.domList = {};
  pgNameHandler(entryDom); // 判断页面是否有自己的方法

  var newPageFunction = window.ozzx.script[pageName];
  if (!newPageFunction) return; // console.log(newPageFunction)
  // 如果有created方法则执行

  if (newPageFunction.created) {
    // 注入运行环境
    newPageFunction.created.apply(assign(newPageFunction, {
      $el: entryDom,
      data: newPageFunction.data,
      activePage: window.ozzx.activePage,
      domList: window.ozzx.domList
    }));
  } // 判断页面是否有下属模板,如果有运行所有模板的初始化方法


  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key];

    if (templateScript.created) {
      // 获取到当前配置页的DOM
      // 待修复,临时获取方式,这种方式获取到的dom不准确
      var domList = entryDom.getElementsByClassName('ox-' + key);

      if (domList.length !== 1) {
        console.error('我就说会有问题吧!');
        console.log(domList);
      } // 为模板注入运行环境


      templateScript.created.apply(assign(newPageFunction.template[key], {
        $el: domList[0].children[0],
        data: templateScript.data,
        activePage: window.ozzx.activePage,
        domList: window.ozzx.domList
      }));
    }
  }
} // ozzx-name处理


function pgNameHandler(dom) {
  // 遍历每一个DOM节点
  for (var i = 0; i < dom.children.length; i++) {
    var tempDom = dom.children[i]; // 判断是否存在@name属性

    var pgName = tempDom.attributes['@name'];

    if (pgName) {
      // console.log(pgName.textContent)
      // 隐藏元素
      tempDom.hide = function () {
        this.style.display = 'none';
      };

      window.ozzx.domList[pgName.textContent] = tempDom;
    } // 判断是否有点击事件


    var clickFunc = tempDom.attributes['@click'];

    if (clickFunc) {
      tempDom.onclick = function (event) {
        var clickFor = this.attributes['@click'].textContent; // 判断页面是否有自己的方法

        var newPageFunction = window.ozzx.script[window.ozzx.activePage]; // console.log(this.attributes)
        // 判断是否为模板

        var templateName = this.attributes['template']; // console.log(templateName)

        if (templateName) {
          newPageFunction = newPageFunction.template[templateName.textContent];
        } // console.log(newPageFunction)
        // 取出参数


        var parameterArr = [];
        var parameterList = clickFor.match(/[^\(\)]+(?=\))/g);

        if (parameterList && parameterList.length > 0) {
          // 参数列表
          parameterArr = parameterList[0].split(','); // 进一步处理参数

          for (var i = 0; i < parameterArr.length; i++) {
            var parameterValue = parameterArr[i].replace(/(^\s*)|(\s*$)/g, ""); // console.log(parameterValue)
            // 判断参数是否为一个字符串

            if (parameterValue.charAt(0) === '"' && parameterValue.charAt(parameterValue.length - 1) === '"') {
              parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1);
            }

            if (parameterValue.charAt(0) === "'" && parameterValue.charAt(parameterValue.length - 1) === "'") {
              parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1);
            } // console.log(parameterArr[i])

          }

          clickFor = clickFor.replace('(' + parameterList + ')', '');
        } // console.log(newPageFunction)
        // 如果有方法,则运行它


        if (newPageFunction[clickFor]) {
          // 绑定window.ozzx对象
          // console.log(tempDom)
          // 待测试不知道这样合并会不会对其它地方造成影响
          newPageFunction.$el = this;
          newPageFunction.$event = event;
          newPageFunction.domList = window.ozzx.domList;
          newPageFunction[clickFor].apply(newPageFunction, parameterArr);
        } else {
          // 如果没有此方法则交给浏览器引擎尝试运行
          eval(this.attributes['@click'].textContent);
        }
      };
    } // 递归处理所有子Dom结点


    if (tempDom.children.length > 0) {
      pgNameHandler(tempDom);
    }
  }
} // 便捷获取被命名的dom元素


function $dom(domName) {
  return ozzx.domList[domName];
} // 跳转到指定页面


function $go(pageName, inAnimation, outAnimation, param) {
  ozzx.state.animation = {
    in: inAnimation,
    out: outAnimation
  };
  var paramString = '';

  if (param && _typeof(param) == 'object') {
    paramString += '?'; // 生成URL参数

    for (var paramKey in param) {
      paramString += paramKey + '=' + param[paramKey] + '&';
    } // 去掉尾端的&


    paramString = paramString.slice(0, -1);
  }

  window.location.href = paramString + "#" + pageName;
} // 获取URL #后面内容


function getarg(url) {
  var arg = url.split("#");
  return arg[1];
} // 页面资源加载完毕事件


window.onload = function () {
  // 取出URL地址判断当前所在页面
  var pageArg = getarg(window.location.hash); // 从配置项中取出程序入口

  var page = pageArg ? pageArg.split('?')[0] : ozzx.entry;

  if (page) {
    var entryDom = document.getElementById('ox-' + page);

    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block';
      window.ozzx.activePage = page; // 更改$data链接

      $data = ozzx.script[page].data;
      runPageFunction(page, entryDom);
    } else {
      console.error('入口文件设置错误,错误值为: ', entryDom);
    }
  } else {
    console.error('未设置程序入口!');
  }
}; // url发生改变事件


window.onhashchange = function (e) {
  var oldUrlParam = getarg(e.oldURL); // 如果旧页面不存在则为默认页面

  if (!oldUrlParam) oldUrlParam = ozzx.entry;
  var newUrlParam = getarg(e.newURL); // 如果没有跳转到任何页面则跳转到主页

  if (newUrlParam === undefined) {
    newUrlParam = ozzx.entry;
  } // 如果没有发生页面跳转则不需要进行操作
  // 切换页面特效


  switchPage(oldUrlParam, newUrlParam);
};

window.ozzx = {
  script: {
    "home": {
      "data": {
        "mode": "real",
        "output": "background",
        "outText": false
      },
      "created": function created() {
        var _this = this;

        $dom('uploadInput').onchange = function () {
          _this.upload($dom('uploadInput').files[0]);
        }; // 拖拽上传事件


        var uploadBox = $dom('uploadBox');

        uploadBox.ondragcenter = function (e) {
          e.preventDefault();
        };

        uploadBox.ondragover = function (e) {
          e.preventDefault();
          uploadBox.classList.add('hover');
        };

        uploadBox.ondragleave = function (e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          uploadBox.classList.remove('hover');
        };

        uploadBox.ondrop = function (e) {
          e.preventDefault();
          uploadBox.classList.remove('hover');

          _this.upload(e.dataTransfer.files[0]);
        };
      },
      "uploadFile": function uploadFile() {
        this.$event.preventDefault();
        $dom('uploadInput').click();
      },
      "upload": function upload(fileData) {
        if (!fileData) {
          console.log('放弃上传!');
        }

        if (fileData.name.lastIndexOf('.psd') + 4 !== fileData.name.length) {
          alert('只允许上传psd文件!');
          return false;
        }

        if (fileData.size > 5 * 60 * 1024 * 1024) {
          alert('上传文件的大小超出限制!');
          return false;
        }

        var file = new FormData();
        file.append('data', fileData); // 获取选择模式

        var mode = this.data.mode; // 输出模式

        var output = this.data.output;
        var outText = this.data.outText; // 传输文件

        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'uploads?mode=' + mode + '&outText=' + outText + '&output=' + output, true); //上传进度事件

        xhr.upload.addEventListener("progress", function (result) {
          if (result.lengthComputable) {
            var percentComplete = result.loaded / result.total;
            $dom('stareIcon').style.display = 'none';
            $dom('progress').style.display = 'block';
            $dom('progress').value = Math.round(percentComplete * 100);
          }
        }, false);
        xhr.addEventListener("readystatechange", function () {
          var result = xhr;

          if (result.status != 200) {
            //error
            console.log('上传失败', result.status, result.statusText, result.response);
          } else if (result.readyState == 4) {
            // 上传完毕
            var msg = JSON.parse(result.response);
            $go('show', 'moveToLeft', 'moveFromRight', {
              id: msg.id
            });
          }
        });
        xhr.send(file);
      },
      "changeModle": function changeModle() {
        if (this.$el.checked) {
          this.data.mode = this.$el.value;
        }
      },
      "changeOutPut": function changeOutPut() {
        if (this.$el.checked) {
          this.data.output = this.$el.value;
        }
      },
      "changeOutText": function changeOutText(item) {
        this.data[item] = !this.data[item];
      }
    },
    "show": {
      "data": {},
      "created": function created() {
        // 获取url参数
        $dom('show').src = './temp/' + $tool.getQueryString('id');
        $dom('show').style.display = 'block';
      },
      "down": function down() {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', 'down?id=' + $tool.getQueryString('id'), true);
        httpRequest.send();
        /**
         * 获取数据后的处理程序
         */

        httpRequest.onreadystatechange = function () {
          if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var res = JSON.parse(httpRequest.responseText);

            if (res.err === 0) {
              window.open("./temp/".concat($tool.getQueryString('id'), ".zip"));
            } else {
              alert(res.message);
            }
          }
        };
      }
    }
  },
  tool: {},
  entry: "home",
  state: {}
}; // 便捷的获取工具方法

var $tool = ozzx.tool;
var $data = {}; // 页面切换效果
// 获取URL参数

function getQueryString(newUrlParam, name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = newUrlParam.match(reg);
  if (r != null) return unescape(r[2]);
  return null;
} // 无特效翻页


function dispalyEffect(oldDom, newDom) {
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none';
  } // 查找页面跳转后的page


  newDom.style.display = 'block';
} // 切换页面动画


function animation(oldDom, newDom, animationIn, animationOut) {
  // 获取父元素
  var parentDom = newDom.parentElement;

  if (!oldDom) {
    console.error('旧页面不存在!');
  }

  oldDom.addEventListener("animationend", oldDomFun);
  newDom.addEventListener("animationend", newDomFun);
  oldDom.style.position = 'absolute';
  newDom.style.display = 'block';
  newDom.style.position = 'absolute'; // document.body.style.overflow = 'hidden'

  parentDom.style.perspective = '1200px';
  oldDom.classList.add('ozzx-animation');
  animationIn.split(',').forEach(function (value) {
    oldDom.classList.add('ox-page-' + value);
  });
  newDom.classList.add('ozzx-animation');
  animationOut.split(',').forEach(function (value) {
    newDom.classList.add('ox-page-' + value);
  }); // 旧DOM执行函数

  function oldDomFun() {
    // 移除监听
    oldDom.removeEventListener('animationend', oldDomFun, false); // 隐藏掉旧的节点

    oldDom.style.display = 'none'; // console.log(oldDom)

    oldDom.style.position = '';
    oldDom.classList.remove('ozzx-animation');
    parentDom.style.perspective = ''; // 清除临时设置的class

    animationIn.split(',').forEach(function (value) {
      oldDom.classList.remove('ox-page-' + value);
    });
  } // 新DOM执行函数


  function newDomFun() {
    // 移除监听
    newDom.removeEventListener('animationend', newDomFun, false); // 清除临时设置的style

    newDom.style.position = '';
    newDom.classList.remove('ozzx-animation');
    animationOut.split(',').forEach(function (value) {
      newDom.classList.remove('ox-page-' + value);
    });
  }
} // 切换页面前的准备工作


function switchPage(oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam;
  var newPage = newUrlParam;
  var newPagParamList = newPage.split('&');
  if (newPage) newPage = newPagParamList[0]; // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页

  if (oldPage === undefined) {
    oldPage = ozzx.entry;
  } else {
    oldPage = oldPage.split('&')[0];
  }

  var oldDom = document.getElementById('ox-' + oldPage);
  var newDom = document.getElementById('ox-' + newPage);

  if (!newDom) {
    console.error('页面不存在!');
    return;
  } // 判断是否有动画效果


  if (!ozzx.state.animation) ozzx.state.animation = {};
  var animationIn = ozzx.state.animation.in;
  var animationOut = ozzx.state.animation.out;

  if (animationIn || animationOut) {
    // 如果没用动画参数则使用默认效果
    if (!animationIn || !animationOut) {
      dispalyEffect(oldDom, newDom);
      return;
    }

    ozzx.state.animation = {};
    animation(oldDom, newDom, animationIn, animationOut);
  } else {
    dispalyEffect(oldDom, newDom);
  }

  window.ozzx.activePage = newPage; // 更改$data链接

  $data = ozzx.script[newPage].data;
  runPageFunction(newPage, newDom);
}
/**
* 获取URL参数中字段的值
* @param  {string} name 参数名称
* @return {string} 返回参数值
*/


ozzx.tool.getQueryString = function (name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
};