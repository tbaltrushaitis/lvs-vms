function buildElements (url, areaMain, areaLegend) {
  $.getJSON(url, function (data) {
    // console.log("entered getJSON");
    capacityClass = '#stat .count';
    areaRoot = areaMain;
    areaPanel = areaLegend;
    areaStats = $('body').find('[id="stat"]');
    dataAll = data;
    listInstances = data.instances;
    listHyps = data.hyps; //_.uniq(_.pluck(listInstances, 'hyp')).sort(_.naturalCmp);
    listLegends = data.legends;
    listProjects = data.projects;
    listQuotas = data.quotas;
    listQuotaUsages = data.quota_usages;
    released = data.options.updated;
    filterConditions = [];
    capacityParams = [];
    gCountCpuTotal = 0;
    gCountCpuActive = 0;
    gCountRamTotal = 0;
    gCountRamActive = 0;

    // set default values for filter conditions array
    _.each(listLegends, function (legend) {
      filterConditions.push(_.object([legend.field], [[]]));
    });

    $('body').find('[id="release"]')
      .append(
        $('<small />').text(
          'Last updated: ' + released.substr(0, 4) + '-' + released.substr(4, 2) + '-' + released.substr(6, 2)
        )
      );

    buildNodes();
    buildLegends();
    getStatsPerProject();
    chartCapacity('capacity');

  }) // getJSON END
  .done(function () {
    // console.log("done");
  })
  .fail(function () {
    // console.log( "fail" );
  })
  .always(function () {
    // console.log( "finally" );
  });
};


function buildNodes () {
  var nodeClass       = 'node',
    popoverHypClass   = 'popover-hyp',
    popoverNodeClass  = 'popover-node',
    hypTitleClass     = 'hyp-title'
  ;

  _.each(listHyps, function (hypData, hypName) {
    var hypNodes = 0,
        hypCpu = 0,
        hypRam = 0,
        hypObject = $('<div />'),
        hypAttr =   {
                        'id': hypName,
                        'class': 'cn hyp'
                    },
        hypTitleHtml = '<p class="' + hypTitleClass + '">' + hypName + '</p>',
        hypPopoverInfo =    "<b>Id:</b> " + hypData.hyp_id + "<br />" +
                            "<b>VCPUs Used:</b> " + hypData.vcpus_used + "<br />" +
                            "<b>VCPUs Free:</b> " + (hypData.vcpus - hypData.vcpus_used) + "<br />" +
                            "<b>RAM Used:</b> " + hypData.memory_mb_used/1024 + "GB" + "<br />" +
                            "<b>RAM Free:</b> " + hypData.free_ram_mb + "MB" + "<br />" +
                            "<b>HDD Used:</b> " + hypData.local_gb_used + "GB" + "<br />" +
                            "<b>HDD Free:</b> " + hypData.free_disk_gb + "GB" + "<br />" +
                            "<b>Running VMs:</b> " + hypData.running_vms + "<br />" +
                            "<hr />" +
                            "<u>CPU Info</u> " + "<br />" +
                            "<b>Vendor:</b> " + hypData.cpu_info.vendor + "<br />" +
                            "<b>Cores:</b> " + hypData.cpu_info.topology.cores + "<br />" +
                            "<b>Threads:</b> " + hypData.cpu_info.topology.threads + "<br />" +
                            "<b>Sockets:</b> " + hypData.cpu_info.topology.sockets + "<br />" +
                            "<hr />" +
                            "<u>Capacity Usage</u> " + "<br />" +
                            "<b>VCPUs:</b> " + ((hypData.vcpus_used*100)/hypData.vcpus).toFixed(2) + "%" + "<br />" +
                            "<b>RAM:</b> " + ((hypData.memory_mb_used * 100)/hypData.memory_mb).toFixed(2) + "%" + "<br />" +
                            "<b>HDD:</b> " + ((hypData.local_gb_used*100)/hypData.local_gb).toFixed(2) + "%" + "<br />" ,
        hypPopoverHtml =    '' +
                            '<div class="' + popoverHypClass + '"' +
                                    'id="span_' + hypData.hyp_id + '"' +
                                    'data-content="' + hypPopoverInfo + '"' +
                                    'data-placement="bottom"' +
                                    'data-toggle="popover"' +
                                    'data-container="#os_prod"' +
                                    'data-animation="true"' +
                                    'data-html="true"' +
                                    'data-original-title="' + hypName + '"' +
                                    'title="' + hypName + '"' + '>' +
                                '<span class="caret"></span>' +
                            '</div>'
    ;
    //console.log(hypData.cpu_info.vendor);
    hypObject.attr(hypAttr).html(hypTitleHtml);
    _.each(_.where(listInstances, {'hyp': hypName}), function (vm_obj) {
      hypNodes++;
      hypCpu += Number(vm_obj.cpu);
      hypRam += Number(vm_obj.ram);
      gCountCpuTotal += Number(vm_obj.cpu);
      gCountRamTotal += Number(vm_obj.ram);

      var itemObject = $('<div />');
      var itemAttr = {
        'id':       vm_obj.uuid,
        'class':    'node ' + vm_obj.group + (vm_obj.power_state == 1 ? '' : ' shutdown'),
        'title':    vm_obj.hostname,
        'project':  vm_obj.project,
        'nodetype': vm_obj.nodetype
      };

      var itemHtml =  '<p>' +
        '<b><a href="https://10.62.0.5/nova/instances/' + vm_obj.uuid + '/" target="blank">' +
          vm_obj.name + '.' + vm_obj.domain +
        '</a></b>' +
        '</p>' +
        '<p class="ip_fixed">' +
          vm_obj.fixed_ip +
        '</p>'
      ;

      var itemPopoverInfo =   "<b>UUID:</b> " + vm_obj.uuid + "<br />" +
        "<b>Project ID:</b> " + vm_obj.project + "<br />" +
        "<b>Tenant:</b> " + vm_obj.projectname + "<br />" +
        "<b>Zone:</b> " + vm_obj.zone + "<br />" +
        "<b>Vlan:</b> " + vm_obj.vlan + "<br />" +
        "<b>Flavor:</b> " + vm_obj.flavor + "<br />" +
        "<b>CPU:</b> " + vm_obj.cpu + "<br />" +
        "<b>RAM:</b> " + vm_obj.ram/1024 + "GB" + "<br />" +
        "<b>Volume:</b> " + vm_obj.volume + "<br />" +
        "<b>Fixed IP:</b> " + vm_obj.fixed_ip + "<br />" +
        "<b>Floating IP:</b> " + vm_obj.floating_ip + "<br />" +
        "<b>VM State:</b> " + vm_obj.vm_state.substring(0, 1).toUpperCase() + vm_obj.vm_state.substring(1) + "<br />" +
        "<b>Power State:</b> " + (vm_obj.power_state == 1 ? 'Running' : 'Shutdown')
      ;
      var itemPopoverHtml =   '' +
        '<div class="' + popoverNodeClass + '"' +
          'id="span_' + vm_obj.uuid + '"' +
          'data-content="' + itemPopoverInfo + '"' +
          'data-placement="bottom"' +
          'data-toggle="popover"' +
          'data-container="#os_prod"' +
          'data-animation="true"' +
          'data-html="true"' +
          'data-original-title="' + vm_obj.hostname + '"' +
          'title="' + vm_obj.hostname + '"' + '>' +
        '<span class="caret"></span>' +
        '</div>'
      ;
      itemObject.attr(itemAttr).html(itemHtml);
      $(itemObject).find('.ip_fixed').append(itemPopoverHtml);
      _.extend(vm_obj, {htmlObj: itemObject, htmlParent: hypObject});
      hypObject.append(itemObject);
    });

    hypObject.find('.' + hypTitleClass).append(hypPopoverHtml).append('<div class="count">' + 'CPU: ' + hypCpu + '; RAM: ' + hypRam/1024 + ' GB;' + '</div>');
    areaRoot.append(hypObject);

  });

  areaStats.append('<table id="table_projects_counts"><thead id="statsheader"></thead><tbody id="statsbody"><tr id="totals"><td>Total:</td><td class="text-right">' + gCountCpuTotal + '</td><td class="text-right">' + gCountRamTotal/1024 + '</td></tr></tbody></table>');
  $('.' + nodeClass).on('click', this, function (e) {
    if ($(e.target).attr('class') != 'caret'){
      var groupClass = '.' + $(this).attr('nodetype');
      $(groupClass).toggleClass('active-nodes');
    };
  });

  $('.' + popoverHypClass).popover();
  $('.' + popoverNodeClass).popover();

};

function getStatsPerProject () {
  $('#statsheader').append('<th>' + 'Project' + '</th><th>&nbsp;CPU&nbsp;</th><th>&nbsp;RAM</th>');
  _.each(dataAll.projects, function (proj){
    var pCpu = 0,
        pRam = 0;
    _.each(_.where(listInstances, {'project': proj.id}), function (inst) {
      pCpu += Number(inst.cpu);
      pRam += Number(inst.ram);
    });
    $('#statsbody').prepend(
      '<tr><td>' + proj.name + '</td><td class="text-right">' + pCpu + '</td><td class="text-right">' + pRam/1024 + '</td></tr>'
    )
  });
};


function buildLegends () {
  _.each(listLegends, function (legend) {
    let containerTitle = $('<h2 class="tab-name">' + legend.name + '</h2>'),
        containerHtml = $('<div id="' + legend.key + '" class="tab-container cn legend"/>');

    areaPanel.append(containerTitle, containerHtml);

    _.each(dataAll[legend.childs], function (legElement) {

      let legendDiv = $('<div id="' + legElement.id + '" class="' + legElement.group + '"/>').attr({
        'data-filter': legElement.entity,
        'data-filter-key': legElement[legend.filterkey]
      }).text(legElement.name);
      _.extend(legElement, {htmlLegend: legendDiv});
      containerHtml.append(legendDiv);

      legElement.htmlLegend.on({
          click: function (e) {
            checkFilterConditions(e, legElement, legend);
            checkStatusNodes(e, legElement, legend);
            checkStatusHyps(e, legElement, legend);
          }
        , mouseover: function (e) {}
        , mouseleave: function (e) {}
      });

    });

  });
};


function checkFilterConditions (e, legElement, legend) {
  var filtKey = $(e.target).attr('data-filter'),
      filtExp = $(e.target).attr('data-filter-key');
  _.each(filterConditions, function (el) {
    var k = _.keys(el)[0],
      v = el[k];
    if (k == filtKey) {
      _.indexOf(v, filtExp) >= 0 ? v = _.without(v, filtExp) : v.push(filtExp);
      o = _.object([k], [v]);
      _.extend(el, o);
    };
  });
};


function checkStatusNodes (e, legElement, legend) {
  gCountCpuTotal = 0;
  gCountCpuActive = 0;
  gCountRamTotal = 0;
  gCountRamActive = 0;
  var self = legElement.htmlLegend,
      arr = [];
  self.toggleClass('active');
  _.each(listInstances, function (node) {

    gCountCpuTotal = gCountCpuTotal + Number(node.cpu);
    gCountRamTotal = gCountRamTotal + Number(node.ram);
    var htmlObj = node.htmlObj,
        htmlParent = node.htmlParent;
    htmlObj.hasClass('active') ? htmlObj.removeClass('active') : true;
    htmlParent.hasClass('active') ? htmlParent.removeClass('active') : true;

    _.each(filterConditions, function (el) {
      var filtCond = _.keys(el)[0],
          filtArr = el[filtCond],
          nodeCondVal = node.htmlObj.attr(filtCond);

      if (_.indexOf(filtArr, nodeCondVal) >= 0) {
        if (!htmlObj.hasClass('active')) {
          htmlObj.addClass('active');
        }
        gCountRamActive +=  Number(node.ram);
        gCountCpuActive +=  Number(node.cpu);
      };
    });
  });
};


function checkStatusHyps (e, legElement, legend) {
  _.each(filterConditions, function (el) {
    var filtCond = _.keys(el)[0],
        filtArr = el[filtCond];
    if (filtCond == 'project') {
      if (filtArr.length == 0) {
        areaRoot.hasClass('project') ? areaRoot.removeClass('project') : true;
        _.each(listHyps, function (hypData, hypName) {
          HypHtml = $('[id="' + hypName + '"]');
          HypHtml.hasClass('active') ? HypHtml.removeClass('active') : true;
        });
      }else{
        areaRoot.hasClass('project') ? true : areaRoot.addClass('project');
        _.each(listHyps, function (hypData, hypName) {
          HypHtml = $('[id="' + hypName + '"]');
          HypHtml.removeClass('active');
          var o = _.object(['hyp'], [hypName]);
          var w = _.where(listInstances, o);
          HypChildsProjects = _.pluck(w, 'project');
          var intersect = _.intersection(filtArr, HypChildsProjects);
          if (intersect.length > 0){
            HypHtml.addClass('active');
          };
        });
      };
    };
  });
};


function tabs (tabNav, tabContainer) {
  $('body').on('click', tabNav, function () {
    if ($(this).next(tabContainer).is(':visible')) {
      $(this).next(tabContainer).slideUp();
    } else {
      $(this).next(tabContainer).slideDown();
    };
  });
};


function chartCapacity (container) {
  var series_data = [];
  _.each(dataAll.projects, function (obj_project) {
    var projId = obj_project.id,
        projQuotaRam = listQuotas[projId].ram,
        projQuotaCpu = listQuotas[projId].cores;
        projQuotaUsedRam = listQuotaUsages[projId].ram,
        projQuotaUsedCpu = listQuotaUsages[projId].cores;
    serName = _.object(['name'], [obj_project.name]);
    _.extend(serName, {'data' : [parseInt(projQuotaUsedRam*100/projQuotaRam), parseInt(projQuotaUsedCpu*100/projQuotaCpu)]});
    _.extend(serName, {'color' : [obj_project.color]});
    series_data.push(serName);
  });
  $('#' + container).highcharts({
    colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
    chart: {
        type: 'column',
        backgroundColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                    stops: [
                        [0, 'rgb(255, 255, 255)'],
                        [1, 'rgb(240, 240, 255)']
                    ]
        },
        borderWidth: 2,
        plotBackgroundColor: 'rgba(255, 255, 255, .9)',
        plotShadow: true,
        plotBorderWidth: 1
    },
    title: {
        text: 'Quotas Usage',
        style: {
            color: '#000',
            font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
        }
    },
    subtitle: {
        text: '',
        style: {
            color: '#666666',
            font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
        }
    },
    xAxis: {
        categories: [
            'RAM',
            'CPU',
            'DISK'
        ],
        gridLineWidth: 1,
        lineColor: '#000',
        tickColor: '#000',
        labels: {
            style: {
                color: '#000',
                font: '11px Trebuchet MS, Verdana, sans-serif'
            }
        },
        title: {
            style: {
                color: '#333',
                fontWeight: 'bold',
                fontSize: '12px',
                fontFamily: 'Trebuchet MS, Verdana, sans-serif'
            }
        }
    },
    yAxis: {
        min: 0,
        minorTickInterval: 5, /*'auto'*/
        lineColor: '#000',
        lineWidth: 1,
        tickWidth: 1,
        tickColor: '#000',
        labels: {
            style: {
                color: '#000',
                font: '11px Trebuchet MS, Verdana, sans-serif'
            }
        },
        title: {
            text: 'used, %',
            style: {
                color: '#333',
                fontWeight: 'bold',
                fontSize: '12px',
                fontFamily: 'Trebuchet MS, Verdana, sans-serif'
            }
        }
    },
    legend: {
        itemStyle: {
            font: '12px Trebuchet MS, Verdana, sans-serif',
            color: 'black'
        },
        itemHoverStyle: {
            color: '#039'
        },
        itemHiddenStyle: {
            color: 'gray'
        }
    },
    labels: {
        style: {
            color: '#99b'
        }
    },
    navigation: {
        buttonOptions: {
            theme: {
                stroke: '#CCCCCC'
            }
        }
    },
    tooltip: {
        headerFormat:   '<span style="font-size:12px; position:block;">{point.key}</span><br /><table>',
        pointFormat:    '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.1f} %</b></td></tr>',
        footerFormat:   '</table>',
        shared: true,
        useHTML: true
    },
    plotOptions: {
        column: {
            pointPadding: 0.1,
            borderWidth: 0
        }
    },
    series: series_data
  });
};
