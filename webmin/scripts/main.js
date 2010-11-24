$(function() {
var client = new RiakClient();

$.fn.notification = function() {
    return this.each(function() {
        var $notice = $('<span>').addClass('notice');

        $(this).bind('notification', function(e, message) {
            if (message) {
                $(e.target).append($notice.text(message));
            } else {
                $notice.detach();
            }
        });

        $(this).bind('notification-fade', function(e, message) {
            $(e.target).append($notice.text(message).hide().fadeIn('500', function() {
                setTimeout(function() {
                    $notice.fadeOut('500', function() {
                        $notice.remove();
                    });
                }, 1500);
            }));
        });
    });
};

$.fn.popup = function() {
    var $overlay = $('<div id="overlay">'),
        $popup = $('<div id="popup">').html('<div class="outer">' + 
                                                '<div class="bg bg-n"></div>' + 
                                                '<div class="bg bg-ne"></div>' + 
                                                '<div class="bg bg-e"></div>' + 
                                                '<div class="bg bg-se"></div>' + 
                                                '<div class="bg bg-s"></div>' + 
                                                '<div class="bg bg-sw"></div>' + 
                                                '<div class="bg bg-w"></div>' + 
                                                '<div class="bg bg-nw"></div>' + 
                                            '</div>' +
                                            '<div class="inner">' +
                                            '</div>' + 
                                            '<a class="close"></a>'),
        $this = this,
        contents;

    $this.bind('open-popup', function(e, form) {
        contents = form;

        $popup.find('.inner').css({
            'height' : ($(window).height() - 100) + 'px'
        }).append(contents);
        $overlay.appendTo($this);
        $popup.appendTo($this);
        $(e.target).trigger('popup-open');
    });

    $this.bind('close-popup', function(e) {
        contents.remove();
        $popup.detach();
        $overlay.detach();
    });

    $popup.find('.close').bind('click', function(e) {
        $this.trigger('close-popup');
    });

    return this;
}

$.fn.breadcrumb = function(controller, query) {
    return this.each(function() {
        switch(controller) {
            case 'bucket':
                $(this).append(
                    $('<a>').attr('href', 'bucket.html?name=' + query.name).addClass('breadcrumb').text(query.name)
                ); 
                break;
            case 'document':
                var bucketManager = 'bucket.html?name=' + query.bucket;
                $(document).bind('delete-document', function(e) {
                    window.location = bucketManager; 
                });

                $(this).append(
                    $('<a>').attr('href', bucketManager).addClass('breadcrumb').text(query.bucket)
                ).append(
                    $('<a>').attr('href', 'document.html?bucket=' + query.bucket + '&key=' + query.key).addClass('breadcrumb').text(query.key)
                ); 
                break;
            default:
                break;
        }
    });
}

$.fn.bucketTable = function(path) {
    var $this = this,
        adminBucket = new RiakBucket('admin', client),
        buckets = {},
        bucketList;
    
    adminBucket.get_or_new('allbuckets', function(status, object) {
        if (status == 'ok') {
            bucketList = object;
            bucketList.contentType = 'application/json';
            if (!object.body) {
                bucketList.body = [];
            }
            
            $(bucketList.body).each(function(index, name) {
                $this.trigger('add-bucket', [name]);
            });
        }
    });
    
    $(document).bind('submit-bucket', function(e, name) {
        var $form = $(e.target);

        if (!name) {
            $form.trigger('notification', ["Bucket name cannot be empty."]); 
        } else if(bucketList.body.indexOf(name) >= 0) {
            $form.trigger('notification', ["This bucket has already been added."]); 
        } else {
            $form.trigger('notification'); 

            // Update admin bucket
            bucketList.body.push(name);
            bucketList.store();
            
            $this.trigger('add-bucket', [name]);
        }
    });

    $this.bind('add-bucket', function(e, name) {
        var $tableRow,
            numDocuments;
        $tableRow = $('<tr>').html('<td><a href="bucket.html?name=' + name + '">' + name + '</a></td>' + 
                                   '<td></td>' +
                                   '<td><button class="remove" value="' + name + '">Remove from list</button></td>');
        $this.each(function() {
            $(this).find('tbody').append($tableRow);
        });
        
        $.getJSON(path + '/' + name + '?keys=true', function(object, status) {
            switch (status) {
                case 'success':
                    buckets[name]   = object;
                    numDocuments    = object.keys.length;

                    $tableRow.find('td').eq(1).text(numDocuments);
                    break;
                default:
                    break;
            }
        }); 
    });
                
    $(document).bind('remove-bucket', function(e, name) {
        var index = $.inArray(name, bucketList.body);

        // Remove bucket from bucketList and save result
        if (index == 0) {
            bucketList.body.shift();
        } else if (index == bucketList.body.length - 1) {
            bucketList.body.pop();
        } else {
            bucketList.body = bucketList.body.slice(0,index).concat(bucketList.body.slice(index+1));
        }

        bucketList.store();

        // Remove bucket from rendered tables
        $this.each(function() {
            var $table = $(this);
            $('tbody tr button.remove', $table).each(function(index) {
                if (this.value == name)
                    $('tbody tr', $table).eq(index).remove();
            });
        });
    });
    
    $(this).delegate('button.remove', 'click', function(e) {
        $(document).trigger('remove-bucket', [e.target.value]);
    });
    
    return this;
};

$.fn.addBucketForm = function() {
    return this.each(function() {
        $(this).bind('submit', function(e) {
            e.preventDefault();

            $(this).trigger('submit-bucket', [$('input.bucket-name', this).val()]);
        });
    });

};

$.fn.documentTable = function(bucket, path) {
    var $this = $(this),
        documents;

    $.getJSON(path + '/' + bucket + '?keys=true', function(object, status) {
        switch (status) {
            case 'success':
                documents = object;
                $(documents.keys).each(function(index, name) {
                    $this.trigger('add-document', [name]);
                });
                break;
            default:
                break;
        }
    });

    $this.delegate('button.remove', 'click', function(e) {
        $(e.target).trigger('riak-document-delete'); 
    });
    
    $(document).bind('add-document', function(e, name) {
        var $tableRow = $('<tr>').html( '<td><a href="document.html?bucket=' + bucket + '&key=' + name + '">' + name + '</a></td>' +
                                        '<td><button class="remove" value=' + name + '>Delete</button></td>');
        $this.find('tbody').append($tableRow);
    });

    $(document).bind('delete-document', function(e, name) {
        $this.find('tbody tr button.remove').each(function(index) {
            if (this.value == name)
                $this.find('tbody tr').eq(index).remove();
        });
    });

    return $this;
}

$.fn.addDocumentButton = function(bucket) {
    var $this = $(this),
        $form,
        editor;

    $this.bind('click', function(e) {
        $form = $('<div class="document-form">').html('<h2>Add Document:</h2>' +
                    '<h3>Key</h3>' +
                    '<p><input type="text" name="key" /></p>' +
                    '<h3>Content-Type</h3>' +
                    '<input type="text" name="mime" />' +
                    '<h3>VClock</h3>' +
                    '<input type="text" name="vclock" />' +
                    '<h3>Body</h3>' +
                    '<div class="wrapper"><textarea name="body">""</textarea></div>' +
                    '<p class="save"><button class="ok">Save Document</button></p>'
                );
        $key = $form.find('[name="key"]').parent();
        editor = new JSONEditor($form.find('textarea'), '100%');

        $form.find('button.ok').bind('click', function(e) {
            $form.trigger('riak-document-save', [editor.getJSON()]); 
        });

        $key.notification();

        $form.bind('save-error', function(e, message) {
            $key.trigger('notification', [message]); 
        });
        
        editor.showFunctionButtons();
        
        $this.trigger('open-popup', [$form]);
    });
    
    $this.bind('popup-open', function(e) {
        editor.rebuild();
    });

    $(document).bind('document-saved', function(e) {
        $this.trigger('close-popup');
    });

    return $this;
};

$.fn.documentButtons = function() {
    var $this = $(this);

    $this.find('.add').bind('click', function(e) {
        $this.trigger('document-save');
    });

    $this.find('.remove').bind('click', function(e) {
        $this.trigger('riak-document-delete');
    });
}

$.fn.documentEditor = function() {
    var $form = $(this),
        editor,
        doc;
    
    $form.trigger('riak-document-get'); 

    $form.bind('document-retrieved', function(e, object) {
        doc = object;
        $form.find('[name="vclock"]').val(doc.vclock);
        $form.find('[name="mime"]').val(doc.contentType);
        
        editor = new JSONEditor($form.find('textarea').val((typeof doc.body == "object") ? JSON.stringify(doc.body) : doc.body), '100%'); 
        editor.showFunctionButtons();
    });

    $form.bind('document-saved', function(e, object) {
        var $notify = $form.prepend($('<p>').notification()).children().eq(0);

        $notify.trigger('notification-fade', ["Document saved..."]);
        console.log($form.find('[name="vclock"]').val());
        console.log(object.vclock);
        $form.find('[name="vclock"]').val(object.vclock);
    });

    $(document).bind('document-save', function(e) {
        $form.trigger('riak-document-update', [doc, editor.getJSON()]); 
    });
}

$.fn.riakHandlers = function(params) {
    var inputs;
    
    for (var key in params) {
        switch (key) {
            case 'bucket':
                bucket = new RiakBucket(params[key], client);
                bucketName = params[key];
                break;
            case 'key':
                documentKey = params[key];
                break;
        }
    }

    $(document).bind('riak-document-get', function(e) {
        var $form   = $(e.target),
            inputs  = getFormInput($form);

        bucket.get(documentKey, function(status, object) {
            switch(status) {
                case 'ok':
                    $form.trigger('document-retrieved', [object]); 
                    break;
                case 'failed':
                    var $notify = $form.find('h2.key').after($('<p>')).next();

                    $notify.notification();
                    $notify.trigger('notification', ["This document does not yet exist!  Saving will add this document to the specified bucket."]);
                    object = new RiakObject(bucketName, documentKey, client);
                    $form.trigger('document-retrieved', [object]); 
                    break;
            }
        });
    });

    $(document).bind('riak-document-save', function(e, body) {
        var $form = $(e.target),
            inputs  = getFormInput($form);
        
        bucket.get(inputs.key, function(status, object) {
            switch (status) {
                case 'ok':
                    $form.trigger('save-error', ["Document already exists!"]);
                    break;
                case 'failed':
                    object = new RiakObject(bucketName, inputs.key, client, JSON.stringify(body), inputs.mime);
                    object.store(function(status, object) {
                        switch (status) {
                            case 'ok':
                                $(document).trigger('add-document', [inputs.key]);
                                $(document).trigger('document-saved', [inputs.key]);
                                break;
                            case 'failed':
                                break;
                            default:
                                break;
                        }
                    });
                    break;
                case 'siblings':
                    break;
                default:
                    break;
            }
        }); 
    });
    
    $(document).bind('riak-document-update', function(e, doc, body) {
        var $form = $(e.target),
            inputs  = getFormInput($form);

        doc.body = JSON.stringify(body);
        
        if (doc.vlock != inputs.vclock)
            doc.vlock = inputs.vclock;

        if (doc.contentType!= inputs.mime)
            doc.contentType = inputs.mime;

        doc.store(function(status, object) {
            switch(status) {
                case 'ok':
                    $form.trigger('document-saved', [object]); 
                    break;
                case 'failed':
                    break;
                default:
                    break;
            }
        });
    });

    $(document).bind('riak-document-delete', function(e) {
        var name = (typeof documentKey != "undefined") ? documentKey : e.target.value;

        bucket.remove(name, function(result, object) {
            if (result) {
                $(document).trigger('delete-document', [name]);
            } else {
            }
        });  
    });

    var getFormInput = function($form) {
        var inputs = {};

        $form.find('input').each(function(index) {
            if ($(this).val() != "")
                inputs[this.name] = $(this).val();
        });

        return inputs;
    }
};

$.fn.renderServerStats = function(path) {
    var cpu = [],
        fsmget = [],
        fsmput = [],
        library = [],
        node = [],
        raw = [],
        ring = [],
        summary = [],
        system = [],
        vnode = []
        target = this
         
        core  = {
            init : function(target) {
                $.getJSON(path + 'stats', function(data) {
                    raw = data;

                    summary.push(["Nodename", data.nodename]);
                    summary.push(["Processes", data.sys_process_count]);
                    summary.push(["Read repairs", data.read_repairs]);
                    summary.push(["Read repairs total", data.read_repairs_total]);
                    summary.push(["Memory allocated", data.mem_allocated]);
                    summary.push(["Memory total", data.mem_total]);
                    summary.push(["Storage backend", data.storage_backend]);

                    node.push(["Node gets", data.node_gets]);
                    node.push(["Node gets total", data.node_gets_total]);
                    node.push(["Node puts", data.node_puts]);
                    node.push(["Node puts total", data.node_puts_total]);

                    vnode.push(["Virtual node gets", data.vnode_gets]);
                    vnode.push(["Virtual node puts", data.vnode_puts]);
                    vnode.push(["Virtual node gets total", data.vnode_gets_total]);
                    vnode.push(["Virtual node puts total", data.vnode_puts_total]);

                    cpu.push(["CPU avg1", data.cpu_avg1]);
                    cpu.push(["CPU avg5", data.cpu_avg5]);
                    cpu.push(["CPU avg15", data.cpu_avg15]);
                    cpu.push(["CPU nprocs", data.cpu_nprocs]);

                    fsmget.push(["FSM get time (mean)", data.node_get_fsm_time_mean]);
                    fsmget.push(["FSM get time (medium)", data.node_get_fsm_time_medium]);
                    fsmget.push(["FSM get time (95%)", data.node_get_fsm_time_95]);
                    fsmget.push(["FSM get time (99%)", data.node_get_fsm_time_99]);
                    fsmget.push(["FSM get time (100%)", data.node_get_fsm_time_100]);

                    fsmput.push(["FSM put time (mean)", data.node_put_fsm_time_mean]);
                    fsmput.push(["FSM put time (medium)", data.node_put_fsm_time_medium]);
                    fsmput.push(["FSM put time (95%)", data.node_put_fsm_time_95]);
                    fsmput.push(["FSM put time (99%)", data.node_put_fsm_time_99]);
                    fsmput.push(["FSM put time (100%)", data.node_put_fsm_time_100]);
                    
                    ring.push(["Ring members", data.ring_members]);
                    ring.push(["Ring ownership", data.ring_ownership]);
                    ring.push(["Ring partitions", data.ring_num_partitions]);
                    ring.push(["Ring creation size", data.ring_creation_size]);

                    system.push(["Driver version", data.sys_driver_version]);
                    system.push(["Global heap size", data.sys_global_heaps_size]);
                    system.push(["Heap type", data.sys_heap_type]);
                    system.push(["Logical processors", data.sys_logical_processors]);
                    system.push(["Erlang release", data.sys_otp_release]);
                    system.push(["SMP support", data.sys_smp_support]);
                    system.push(["System version", data.sys_system_version]);
                    system.push(["Architecture", data.sys_system_architecture]);
                    system.push(["Threads enabled", data.sys_threads_enabled]);
                    system.push(["Thread pool size", data.sys_thread_pool_size]);
                    system.push(["Word size", data.sys_wordsize]);

                    library.push(["Luwak version", data.luwak_version]);
                    library.push(["Skerl version", data.skerl_version]);
                    library.push(["Riak kv version", data.riak_kv_version]);
                    library.push(["Riak core version", data.riak_core_version]);
                    library.push(["Bitcask version", data.bitcask_version]);
                    library.push(["Luke version", data.luke_version]);
                    library.push(["Webmachine version", data.webmachine_version]);
                    library.push(["Mochiweb version", data.mochiweb_version]);
                    library.push(["Erlang js version", data.erlang_js_version]);
                    library.push(["Runtime tools version", data.runtime_tools_version]);
                    library.push(["Crypto version", data.crypto_version]);
                    library.push(["OS mon version", data.os_mon_version]);
                    library.push(["Sasl version", data.sasl_version]);
                    library.push(["Stdlib version", data.stdlib_version]);
                    library.push(["Kernel version", data.kernel_version]);

                    $(target).trigger('render-stats');
                });
            }
        };
        

    $(this).bind('render-stats', function(e) {
        var list = [];
        $('table', target).each(function(index, table) {
            switch (table.id) {
                case 'server-summary':
                    list = summary;
                    break;
                case 'sys-info':
                    list = system;
                    break;
                case 'node-info':
                    list = node;
                    break;
                case 'vnode-info':
                    list = vnode;
                    break;
                case 'cpu-info':
                    list = cpu;
                    break;
                case 'software-info':
                    list = library;
                    break;
                case 'fsm-get-info':
                    list = fsmget;
                    break;
                case 'fsm-put-info':
                    list = fsmput;
                    break;
                case 'ring-info':
                    list = ring;
                    break;
                default:
                    list = [];
                    break;
            }

            $(list).each(function(index) {
                switch (typeof this[1]) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                        $(table).append(
                            $('<tr>').html('<th>' + this[0] + '</th><td>' + this[1] + '</td>')
                        );
                        break;
                    case 'undefined':
                        $(table).append(
                            $('<tr>').html('<th>' + this[0] + '</th><td>-----</td>')
                        );
                        break;
                    case 'object':
                        $(table).append(
                            $('<tr>').html('<th>' + this[0] + '</th><td><p>' + this[1].join('</p><p>') + '</p></td>')
                        );
                        break;
                    default:
                        break;
                }
            });
        });

        $('h3', this).each(function(index) {
            $(this).bind('click', function(e) {
                $(this).next('div').slideToggle('fast');
            });
        });
    });

    core.init(this);
};

controller = {
    handler : '',
    query : {},
    path : '',
    root : '',

    init : function() {
        var search  = window.location.search,
            search  = (search == "") ? search : search.substring(1),
            parts;

        for (i in parts = search.split('&')) {
            var tmp = parts[i].split('=');
            this.query[tmp[0]] = tmp[1];
        }

        parts = window.location.pathname.match(/(.+)\/webmin\/(.+)\.html/);
        path = parts[1];
        this.handler = parts[2];
        root = path.match(/(.*\/)(.*)/)[1];

        // Initialize/Render server stats
        $('#server-info').renderServerStats(root);

        switch(this.handler) {
            case 'index':
                $('#bucket-table').bucketTable(path);
                $('#add-bucket').addBucketForm();
                $('#add-bucket').notification();
                break;
            case 'bucket':
                $(document).riakHandlers({
                    "bucket" : this.query.name 
                });
                $('header').breadcrumb(this.handler, this.query);
                $('h1 span').text(this.query.name);
                $('body').popup();
                $('nav#top-nav').find('button').addDocumentButton(this.query.name);
                $('#document-table').documentTable(this.query.name, path);
                break;
            case 'document':
                $(document).riakHandlers({
                    "bucket" : this.query.bucket,
                    "key" : this.query.key
                });
                $('header').breadcrumb(this.handler, this.query)
                $('nav#top-nav').documentButtons();
                $('#document .bucket').append($('<b>').text(this.query.bucket));
                $('#document .key').append($('<b>').text(this.query.key));
                $('#document').documentEditor();
                break;
            default:
                // Some sort of error handler
                //page[404]();
                break;
        }
    },
};

//    stats.init();
controller.init();
});
