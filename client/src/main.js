$.fn.dragAndDrop = function(p){
  var parameters = {
    'supported' : [''],
    'size' : 5,
    'uploadFile' : 'uploads?mode=real',
    'sizeAlert' : '文件大小超过限制!',
    'done' : function (msg) {
      console.info('upload done');
    },
    'error' : function (msg) {
      console.info('upload fail');
    },
    'onProgress' : function(progress){
      console.info(Math.round(progress * 100) + '%');
    }
  };

  $.extend(parameters,p);

  function upload(fd) {
    // 获取选择模式
    var mode = $("input[name='rb']:checked").val()
    // 输出模式
    var output = $("input[name='output']:checked").val()
    var outText = document.getElementById('outText').checked
    $.ajax({
      type: 'POST',
      url: 'uploads?mode=' + mode + '&outText=' + outText + '&output=' + output,
      data: fd,
      processData: false,
      contentType: false,
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener("progress", function(evt){
          if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            parameters.onProgress(percentComplete);
          }
        }, false);
        return xhr;
      },
    }).done(parameters.done).error(parameters.error);
  }

  this.each(function(){
    var $this = $(this);

    $this.find('.dndAlternative').on('click',function(e){
      e.preventDefault();
      $this.find('input[type="file"]').trigger('click');
    });

    $this.find('input[type="file"]').on('change',function(){
      fd = new FormData();
      fd.append('data', $(this)[0].files[0])
      upload(fd)
    });


    $this.on({
      dragcenter : function(e){
        e.preventDefault();
      },
      dragover : function(e){
        e.preventDefault();
        $this.addClass('hover');       
      },
      dragleave : function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        $this.removeClass('hover');
      },
      // 拖放文件事件
      drop : function(e) {
        e.preventDefault()

        $this.removeClass('hover')

        var files = e.originalEvent.dataTransfer.files

        fd = new FormData();
        fd.append('data', files[0])
        if(files[0].name.lastIndexOf('.psd') + 4 !== files[0].name.length){
          alert('只允许上传psd文件!')
          return false
        }

        if(files[0].size > parameters.size * 60 * 1024 * 1024 ){
          alert('上传文件的大小超出限制!')
          return false
        }

        upload(fd)
      }
    })
  })
}

$('#dnd').dragAndDrop({
  'done' : function(msg) {
    $('#dnd .start, #dnd .error,#dnd progress').hide();
    $('#dnd .done').show()
    if (msg.err == 0) {
      // setTimeout(() => {
      //   window.location.href = '/temp/' + msg.id
      // }, 500)
      ozzx.state.showId = msg.id
      $go('show', 'moveToLeft', 'moveFromRight')
    } else {
      alert('服务端返回错误的结果!')
    }
  }, 
  'error' : function() {
    $('#dnd .start, #dnd .done, #dnd progress').hide()
    $('.error').show()
  },
  'onProgress' : function(p) {
    $('#dnd .start,#dnd .done, #dnd .error').hide();
    $('#dnd progress').show().val(Math.round(p * 100));
  }
});