let widthSvg = 1500;//document.getElementById("mainPlot").clientWidth-101;
let heightSvg = 1000;
let margin = ({top: 20, right: 50, bottom: 50, left: 50});



//dataprt

let service_part =0;

let wssvg = d3.select("#WScontent"),
    netsvg = d3.select("#networkcontent"),
    scsvg = d3.select("#Scattercontent"),
    tsnesvg = d3.select("#t_sne_content");
let x,y,color,colorContinous,brush,legendScale,scaleX,scaleY;

let dataInformation ={
};


let filterConfig_gab = {
    unit: 'Score',
    isColorMatchCategory: false,
    timeTemp: [undefined,undefined],
    time: [undefined,undefined],
    maxevent : 15,
    maxeventAll : 200,
    limitSudden : 10,
    limitconnect : 4,
    scalevalueLimit: 0.1
};
let filterConfig_adl  = {
    unit: 'Frequency',
    isColorMatchCategory: true,
    timeTemp: [undefined,undefined],
    time: [undefined,undefined],
    maxevent : 15,
    maxeventAll : 500,
    limitSudden : 2,
    limitconnect : 1,
    scalevalueLimit: 0.1
};
let filterConfig_huff = {
    unit: 'Frequency',
    isColorMatchCategory: true,
    timeTemp: [undefined,undefined],
    time: [undefined,undefined],
    maxevent : 10,
    maxeventAll : 200,
    limitSudden : 50,
    limitconnect : 4,
    scalevalueLimit: 0.1
};
let filterConfig = filterConfig_gab;
let scatterConfig ={
    g:{},
    margin: {top: 10, right: 10, bottom: 40, left: 40},
    scaleView:1,
    width: 500,
    height: 500,
    widthG: function(){return this.width-this.margin.left-this.margin.right},
    heightG: function(){return this.height-this.margin.top-this.margin.bottom},
    scale:5,
};
let wsConfig ={
    g:{},
    margin: {top: 5, right: 5, bottom: 30, left: 5},
    width: widthSvg,
    height: 500,
    widthG: function(){return this.width-this.margin.left-this.margin.right},
    heightG: function(){return this.height-this.margin.top-this.margin.bottom},
};
let netConfig ={
    g:{},
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    scalezoom: 1,
    width: widthSvg,
    height: heightSvg,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
    colider: function() {return this.smallgrapSize()/2},
    ratiograph: 24,
    smallgrapSize: function(d){return this.width/this.ratiograph},
    fontRange:[15,20]
};
let tsneConfig ={
    g:{},
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    scalezoom: 1,
    width: widthSvg,
    height: heightSvg,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
    colider: function() {return this.smallgrapSize()/2},
    ratiograph: 24,
    smallgrapSize: function(d){return this.width/this.ratiograph},
    fontRange:[15,20],
    opt:{
        epsilon : 10, // epsilon is learning rate (10 = default)
        perplexity : 30, // roughly how many neighbors each point influences (30 = default)
        dim : 2 // dimensionality of the embedding (2 = default)
    },
};


let dataRaw = [];
let data,nestbyKey, sumnet=[];


/* Initialize tooltip */
let tip = d3.tip().attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        console.log(d)
        return ([d.values[0].text,d.values[0].connect.map(e=> {
            if (e.source.key !== d.values[0].key)
                return e.source.text;
            return  e.target.text;
        }).join(', ')]).join(': '); });
let tip2 = d3.tip().attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) { return d.values[0].text+'-'+d.values[0].topic; });


$(document).ready(function(){
    //scatterConfig.scaleView = $('#mainPlot').width()/scatterConfig.width;
    console.log('ready');
    $('.collapsible').collapsible();
    // $('.dropdown-trigger').dropdown();
    $('.sidenav').sidenav();
    discovery('#sideNavbtn');
    $('.tabs').tabs({'onShow':function(){
        if ($('#demo').css('display')!=="none")
        initialize()}});
    d3.select("#DarkTheme").on("click",switchTheme);
    d3.select('#datacom').on("change", function () {
        d3.select('.cover').classed('hidden', false);
        const choice = this.value;
        const choicetext = d3.select('#datacom').node().selectedOptions[0].text;
        netConfig.simulation.stop();
        setTimeout(() => {
            filterConfig = eval('filterConfig_'+choice);
            eval(choice)(new Date('2010')).then(function(d){
                reset();
                datahandle(d);

                d3.select(".currentData")
                    .text(choicetext);});
        },0);
    });
    if ($('#demo').css('display')!=="none")
        initialize();
});
function reset(){
    wssvg.selectAll('*').remove();
    netsvg.selectAll('*').remove();
    scsvg.selectAll('*').remove();
    filterConfig.timeTemp= [undefined,undefined];
    filterConfig.time = [undefined,undefined];
    // wsConfig.g.remove();
    // wsConfig.g ={};
    // scatterConfig.g.remove();
    // scatterConfig.g={};
    // netConfig.g.remove();
    // netConfig.g = {};
}
function discovery(d){
    d3.select(d).style('left','20px')
        .classed("pulse",true)
        .transition().delay(5000).duration(1000)
        .style('left',null).on('end',function() {
        d3.select(d).classed("pulse",false);
    });

}

(function ($) {
    $.each(['show', 'hide'], function (i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function () {
            this.trigger(ev);
            return el.apply(this, arguments);
        };
    });
})(jQuery);

var initialize = _.once(initDemo);

function initDemo(){
    widthSvg = $('#network').width();
    wsConfig.width = $('#WS').width();
    scatterConfig.width = $('#mainPlot').width();
    scatterConfig.height = scatterConfig.width;
    netConfig.width = widthSvg;
    init();
}
let textSpinner;
function init(){

    textSpinner = d3.select('.spinnerC').select('h3').text('load Data').on('message',(string)=>{console.log('call');
        setTimeout(function(){d3.select('.spinnerC').select('h3').text('caculate...')},0)});
    // var dispatch = d3.dispatch("updateSpinner");
    // dispatch.on("updateSpinner", (string)=>{console.log('call');
    //     d3.select('.spinnerC').select('h3').text('caculate...')});
    gab(new Date('2010')).then(function(d){datahandle(d)});

}
function datahandle(d){
    // read and assign
    dataRaw = d;

    // filter data maxevent and limitsudden
    data = filterTop(dataRaw);
    initOther();
    initLegendGroup(dataRaw);
    // textSpinner.dispatch("message");
    callSum(data);
    initNetgap();
    textSpinner.text('Create network...');
    x = d3.scaleLinear()
        .domain([0,1]).nice()
        .range([0, netConfig.smallgrapSize()]);
    y = d3.scaleLinear()
        .domain([0,1]).nice()
        .range([netConfig.smallgrapSize(),0]);
    initScatter ();
    // WORD STREAM
    initWS ();
    drawWS();

    renderWS(data);
    // SCATTER PLOT
    drawInstances(dataRaw);
    drawScatter();
    nodenLink = callgapsall(data,filterConfig.limitconnect);
    //initNetgap();
    drawNetgapHuff(nodenLink,filterConfig.isColorMatchCategory);

    // initTSNE (); //tsne
    // drawTSNE (nestbyKey);
    d3.select('.cover').classed('hidden',true);

}
function initTSNE (){

    tsneConfig.margin = ({top: 0, right: 0, bottom: 0, left: 0});
    tsneConfig.width = widthSvg;
    tsneConfig.height = heightSvg;
    tsnesvg
        .attrs({
            width: tsneConfig.width,
            height: tsneConfig.height,
            // overflow: "visible",

        });
    const tsnesvgG = tsnesvg.append("g")
        .attr('class','graph')
        .attr('transform',`translate(${tsneConfig.margin.left+tsneConfig.widthG()/2},${tsneConfig.margin.top+tsneConfig.heightG()/2})`);

    tsneConfig.g = tsnesvgG ;
    function zoomed() {
        tsneConfig.ss = d3.event.transform.k;
        tsneConfig.tx = d3.event.transform.x;
        tsneConfig.ty = d3.event.transform.y;
    }

    var zoom = d3.zoom()
    // .scaleExtent([1/netConfig.scalezoom, 40])
        .scaleExtent([0.25, 40])
        //.translateExtent([[-netConfig.width/2,-netConfig.height/2], [netConfig.width*1.5,netConfig.height*1.5]])
        .on("zoom", zoomed);
    tsnesvg.call(zoom);
    // tsnesvg.call(tip);
    zoom.scaleTo(tsnesvg, 1/tsneConfig.scalezoom);
    tsnesvg.call(zoom.translateTo, tsneConfig.widthG() / 2,tsneConfig.heightG() / 2);

    tsneConfig.dotrain = false;
    tsneConfig.stepInterval = setInterval(step, 10);
    function step() {
        if(tsneConfig.dotrain) {
            var cost = tsneConfig.tsne.step(); // do a few steps
            $("#cost").html("iteration " + tsneConfig.tsne.iter + ", cost: " + cost);
        }
        updateEmbedding();
    }
    function updateEmbedding() {
        // get current solution
        var Y = tsneConfig.tsne.getSolution();
        // move the groups accordingly
        tsneConfig.g.selectAll('.linkLineg').attr("transform", function(d, i) { return "translate(" +
            (Y[i][0]*20*tsneConfig.ss+tsneConfig.tx) + "," +
            (Y[i][1]*20*tsneConfig.ss+tsneConfig.ty ) + ")"; });

    }
}

function drawTSNE (nest) {
    tsneConfig.dotrain = false;
    tsneConfig.tsne = new tsnejs.tSNE(tsneConfig.opt);
    tsneConfig.tsne.initDataRaw(nest.map(d=>d3.merge(d.values.map((e,i)=>[e.f]))));


    tsneConfig.dotrain = true;

    drawEmbedding(nest);


    function drawEmbedding(data) {

        let datapoint = tsneConfig.g.selectAll(".linkLineg")
            .data(data);
        let datapointN = datapoint
            .enter().append("g")
            .attr("id",d=>"clus_"+d.key)
            .attr("class", "linkLineg");


        datapointN.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 5)
            .attr('stroke-width', 1)
            .attr('stroke', 'black')
            .attr('fill', 'rgb(100,100,255)');

        datapointN.append('path')
            .style('stroke',d=>
                filterConfig.isColorMatchCategory?color(d.values[0].topic):colorContinous(d.gap))
            .datum(d=>d.values)
            .attr('stroke-width',0.5);

        datapointN.append("text")
            .attr("text-anchor", "top")
            .attr("transform", "translate(5, -5)")
            .attr("font-size", 12);

        datapoint.exit().remove();

        tsneConfig.g.selectAll(".linkLineg").selectAll('path')
            .call(d=>lineConnect(d,1))
            .attr('stroke-width',0.5);

        tsneConfig.g.selectAll(".linkLineg").selectAll('text')
            .text(function(d,i) {return d.values[0].text })

    }

    tsneConfig.stepnum = 0;
    tsneConfig.iid = -1;
}

function initLegendGroup(data){
    let nesteddata = d3.nest().key(d=>d.topic).key(d=>d.key).entries(data);
    dataInformation.lengend = {};
    dataInformation.lengend.data = nesteddata.map(d=>{return{topic: d.key, terms:d.values.length}});
    dataInformation.lengend.total =d3.sum(dataInformation.lengend.data,d=>d.terms);
    d3.select('#legendGroup')
        .selectAll("*").remove()
    let legend_data = d3.select('#legendGroup')
        .selectAll(".row")
        .data(dataInformation.lengend.data);
    let legend = legend_data
        .enter().append("div")
        .attr('class','row')
        .attr("title", "Hide group");
    legend
        .append("span")
        .style("background", function(d,i) { return color(d.topic)})
        .attr("class", "color-bar");
    legend
        .append("span")
        .attr("class", "tally");

    legend
        .append("span")
        .text(function(d,i) { return " " + d.topic});
    legend.call(updatelegend);

}

function updatelegend(l){
    l.select('.tally').transition()
        .duration(500).text(function(d,i) { return d.terms});
    l.select('.color-bar').transition()
        .duration(500)
        .style("width", function(d) {
            return Math.ceil(widthSvg/5*d.terms/dataInformation.lengend.total) + "px";
        });
}

function drawlegend(d1){
    // let cal1 = new Date();
    let TR = d1||filterConfig.time.map(wsConfig.time2index.invert);
    dataInformation.lengend.data =_.chain(dataRaw)
        .filter(d=>d.f!==0)
        .groupBy(d=>d.key).map(d=>d[0])
        .filter(d=>{
                let cT = d.timestep;
                return ((cT >= TR[0]) && (cT <= TR[1])); //in range time
            })
        .groupBy(d=>d.topic)
        .map(d=>{return {topic: d[0].topic, terms:d.length}})
        .value();
    // let cal2 = new Date();
    // console.log('---- filter legend ----: '+(cal2-cal1));
    d3.select('#legendGroup')
        .selectAll(".row")
        .data(dataInformation.lengend.data,d=>d.topic)
        .call(updatelegend);

}
function recall (){
    let cal1 = new Date();
        data = filterTop(dataRaw);
    let cal2 = new Date();
    textSpinner.text('filter...');
    console.log('---- filter Top ----: '+(cal2-cal1));
        callSum(data);
    cal1 = new Date();
    console.log('---- call average ----: '+(cal1-cal2));
    drawWS();
    cal2 = new Date();
    console.log('---- drawWS ----: '+(cal2-cal1));
        // hightlightWS();
        nodenLink = callgapsall(data,filterConfig.limitconnect);
    cal1 = new Date();
    console.log('---- call LINK ----: '+(cal1-cal2));
        //initNetgap();
        drawNetgapHuff(nodenLink,filterConfig.isColorMatchCategory);
        drawScatter();

    // drawTSNE (nestbyKey);
        d3.select('.cover').classed('hidden',true);
}
function initOther(){
    let colors = d3.schemeCategory10;
    // let colors = d3.scaleOrdinal(d3.schemeCategory10);
    // color =function (category) {
    //     if (category== 'person')
    //         return colors[2] ; // leaf node
    //     else if (category=='location')
    //         return colors[3] ; // leaf node
    //     else if (category=='organization')
    //         return colors[0] ; // leaf node
    //     else if (category=='miscellaneous')
    //         return colors[1] ; // leaf node
    //     else
    //         return colors[4];
    // };
    color = d3.scaleOrdinal(d3.schemeCategory10);
    wsConfig.time2index = d3.scaleTime().domain(d3.extent(data, function(d) { return d.timestep; })).rangeRound([0,d3.nest().key(d=>d.timestep).entries(data).length-1]);
    filterConfig.time = wsConfig.time2index.range();
}

function initScatter () {
    scsvg.attrs({
        preserveAspectRatio:"xMinYMin meet",
        viewbox:"0 0 "+scatterConfig.width+" " +scatterConfig.height,
        width:scatterConfig.width,
        height:scatterConfig.height,
    });
    let scsvg_g = scsvg.append('g')
        .attr('class','zoomContent').attr("transform","scale("+scatterConfig.scaleView+","+scatterConfig.scaleView+")");;
    scsvg_g.append('g')
        .attr('class','axis')
        .attr('transform',`translate(${scatterConfig.margin.left},${scatterConfig.margin.top})`);

    scsvg.g = scsvg_g.append('g')
        .attr('class','graph')
        .attr('transform',`translate(${scatterConfig.margin.left},${scatterConfig.margin.top})`)
            .append('svg')
            .attrs({
                width: scatterConfig.widthG(),
                height: scatterConfig.heightG(),
            });

    scatterConfig.scale = netConfig.smallgrapSize()/scatterConfig.widthG();
    scatterConfig.x = d3.scaleLinear().domain(d3.extent(data,d=>d.f)).nice().range([0, scatterConfig.widthG()]);
    // scatterConfig.x = d3.scaleSymlog().domain(d3.extent(data,d=>d.f)).nice().range([0, scatterConfig.widthG()]);
    scatterConfig.y = d3.scaleLinear().domain(d3.extent(data,d=>d.df)).nice().range([scatterConfig.heightG(), 0]);
    // scatterConfig.y = d3.scaleSymlog().domain(d3.extent(data,d=>d.df)).nice().range([scatterConfig.heightG(), 0]);
    scatterConfig.lineConnect = function (l){
        return l
            .attrs({
                class: 'linkLine',
                d: d3.line()
                    .curve(d3.curveCardinal.tension(0.25))
                    .x(function(d) {
                        return scatterConfig.x(d.values[0].f); })
                    .y(function(d) { return scatterConfig.y(d.values[0].df); })
            })
    };
    scatterConfig.xAxis = g => g
        .attr("transform", `translate(0,${scatterConfig.heightG()})`)
        .call(d3.axisBottom(scatterConfig.x).ticks(5))
        .call(g => g.append("text")
            .attr("x", scatterConfig.widthG())
            .attr("y", -4)
            // .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .attr('class','labelx axisLabel')
            .text(filterConfig.unit));
    scatterConfig.yAxis = g => g
        .attr("transform", `translate(0,0)`)
        .call(d3.axisLeft(scatterConfig.y).ticks(5))
        //.call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 4)
            .attr("class","axisLabel")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr('class','labely axisLabel')
            .text("\u0394 "+filterConfig.unit));
    scsvg.gIn = scsvg.g.append('g')
        .attr('id','InstancePlot');
    scsvg.select('.axis').append('g')
        .attr('class','axis--x')
        .call(scatterConfig.xAxis);
    scsvg.select('.axis').append('g')
        .attr('class','axis--y')
        .call(scatterConfig.yAxis);
    scsvg.g.call(tip2);

    scatterConfig.xAxisSpike = d3.axisTop(scatterConfig.x).tickValues([]).tickSize(scatterConfig.height/2);
    scatterConfig.yAxisSpike = d3.axisRight(scatterConfig.y).tickValues([]).tickSize(scatterConfig.width/2);
    scsvg.select('.axis').append('g')
        .attr('class','axis--y--spike')
        .call(customYAxis);
    scsvg.select('.axis').append('g')
        .attr('class','axis--x--spike')
        .attr("transform", `translate(0,${scatterConfig.heightG()})`)
        .call(customXAxis);
}

function customYAxis(g) {
    g.call(scatterConfig.yAxisSpike);
    g.select(".domain").remove();
    g.selectAll(".tick line").attr("stroke", "#777").attr("stroke-dasharray", "2,2");
    g.selectAll(".tick text").attr("x", 4).attr("dy", -4);
}

function customXAxis(g) {
    g.call(scatterConfig.xAxisSpike);
    g.select(".domain").remove();
    g.selectAll(".tick line").attr("stroke", "#777").attr("stroke-dasharray", "2,2");
    g.selectAll(".tick text").style('text-anchor','end').attr("dx", -4).attr("y", -4);
}

function customTimeAxis(g) {
    g.call(wsConfig.timeAxisSpike);
    g.select(".domain").remove();
    g.selectAll(".tick line").attr("stroke", "#777").attr("stroke-dasharray", "2,2");
    g.selectAll(".tick text").style('text-anchor','end').attr("dx", -4).attr("y", -4);
}

function updateSpike(x,y,time){
    if (x&&y) {
        scatterConfig.yAxisSpike.tickValues([y]).tickSize(scatterConfig.x(x));
        scsvg.select('.axis--y--spike').call(customYAxis);
        scatterConfig.xAxisSpike.tickValues([x]).tickSize(scatterConfig.heightG() - scatterConfig.y(y));
        scsvg.select('.axis--x--spike').call(customXAxis);
        wsConfig.timeAxisSpike.tickValues([time]);
        wssvg.select('.axis--x--spike').call(customTimeAxis);
    }else
    {
        scatterConfig.yAxisSpike.tickValues([]);
        scsvg.select('.axis--y--spike').call(customYAxis);
        scatterConfig.xAxisSpike.tickValues([]);
        scsvg.select('.axis--x--spike').call(customXAxis);
        wsConfig.timeAxisSpike.tickValues([]);
        wssvg.select('.axis--x--spike').call(customTimeAxis);
    }
}

function drawInstances(dataR){
    let datanest = d3.nest()
        .key(function(d) { return d.key; }).sortValues((a,b)=>(b.df-a.df))
        .rollup(d=>d.slice(0,1))
        .entries(dataR);
    // let nestSumAlltime = d3.nest()
    //     .key(function(d) { return d.timestep; })
    //     .rollup(d=>{return [{df: d3.mean(d,e=>e.df), f: d3.mean(d,e=>e.f), timestep: d[0].timestep}]})
    //     .entries(dataR);
    // // let nestSumAlltime = d3.nest()
    // //     .key(function(d) { return d.timestep; })
    // //     .rollup(d=>{return [{df: d3.median(d.filter(e=>e.f).map(e=>e.df).sort((a,b)=>a-b)), f: d3.median(d.filter(e=>e.f).map(e=>e.f).sort((a,b)=>a-b)), timestep: d[0].timestep}]})
    // //     .entries(dataR);
    // nestSumAlltime.forEach(d=>{d.values=d.value; delete d.value});
    let pointsdata = scsvg.gIn.selectAll(".gInstance")
        .data(datanest,d=>d.value);
    let gpoints_new = pointsdata.enter()
        .append('g')
        .attr('class','gInstance').style('opacity',0);

    gpoints_new.selectAll(".instancePoint")
        .data(d=>d.value).enter()
        .append('circle')
        .attr('class','instancePoint');
    //remove
    pointsdata.exit().transition().duration(1000)
        .style('opacity',0.1).remove();
    //update data
    let gpoints = scsvg.g.selectAll(".gInstance")
        .attr('id', d=>'instance'+d.key).call(activepoint);

    gpoints.selectAll(".instancePoint").attrs({
        cx: d=>scatterConfig.x(d.f),
        cy: d=>scatterConfig.y(d.df),
        r:  2})
        .style('opacity',0.2)
        .style('fill',d=> color(d.topic));
    // scsvg.gIn
    //     // .select('.gSumLine')
    //     // .data([nestSumAlltime])
    //     // .enter()
    //     // .append('g')
    //     // .attr('class','gSumLine')
    //
    //     .append('path').datum(nestSumAlltime)
    //     .styles({
    //         fill: 'none',
    //         stroke: 'black',
    //         'stroke-width' : 2
    //     })
    //     .call(scatterConfig.lineConnect)
    //     .classed('linkLine',false)
    //     .classed('gSumLine',true);

}

function drawScatter(){
    let datanest = d3.nest()
        .key(function(d) { return d.key; })
        .key(function(d) { return d.timestep; })
        .entries(data);

    datanest.forEach((d,i)=>d.gap =nestbyKey[i].gap);
    let pointsdata = scsvg.g.selectAll(".gCategory")
        .data(datanest,d=>d.values);
    let gpoints_new = pointsdata.enter()
        .append('g')
        .attr('class','gCategory').style('opacity',0);

    gpoints_new.selectAll(".datapoint")
        .data(d=>d.values).enter()
        .append('circle')
        .attr('class','datapoint');
    //remove
    pointsdata.exit().transition().duration(1000)
        .style('opacity',0.1).remove();
    //update data
    let gpoints = scsvg.g.selectAll(".gCategory")
        .attr('id', d=>d.key).call(activepoint);

    gpoints.selectAll(".datapoint").attrs({
        cx: d=>scatterConfig.x(d.values[0].f),
        cy: d=>scatterConfig.y(d.values[0].df),
        r:  2})
        .style('fill',d=> filterConfig.isColorMatchCategory?color(d.values[0].topic):null)
        .on('mouseover',function(d){
            tip2.show(d);
            mouseoverHandel(d);})
        .on('mouseleave',function(d){
            tip2.hide();
            mouseleaveHandel(d)})

    scsvg.g.select('.gSumLine').remove();

    scsvg.g
        .append('path').datum(sumnet)
        .styles({
            fill: 'none',
            stroke: 'black',
            'stroke-width' : 2
        })
        .call(scatterConfig.lineConnect)
        .classed('linkLine',false)
        .classed('gSumLine',true);

    // scsvg.g.call(sumgap);
   // d3.select('#legend-svg').call(colorlegend);
}

function mouseoverHandel(datain){
    let timestep = datain.key;
    let datapoint = datain.values[0];
    let cpoint = scsvg.g.selectAll(".gCategory").filter(f=>f.key!==datapoint.key);
    cpoint.transition().duration(500)
        .call(deactivepoint);
    let currentHost = scsvg.g.select("#"+datapoint.key);
    updateSpike(datapoint.f,datapoint.df,datapoint.timestep);
    netsvg.selectAll(".linkLineg").style('opacity',0.2);
    netsvg.selectAll(".linkText").style('opacity',0.2);
    d3.select('#mini'+datapoint.key).style('opacity',1);
    d3.select('#text'+datapoint.key).style('opacity',1);
    d3.selectAll(".linkGap").style('stroke-opacity',0.1);
    // word stream
    wssvg.selectAll('.gtext').filter(d=>d.data.key!==datapoint.key).style('opacity',0.1);
    d3.selectAll(".linkGap").filter(d=>{
        if (d.source.key===datapoint.key)
        {
            d3.select('#text' + d.target.key).style('opacity', 1);
            d3.select('#mini'+d.target.key).style('opacity',1);
            wssvg.selectAll('.gtext').filter(s=>s.data.key===d.target.key).style('opacity',1)
                .select('.stext').attr('visibility','visible');
            return true;
        }
        if (d.target.key===datapoint.key)
        {
            d3.select('#text' + d.source.key).style('opacity', 1);
            d3.select('#mini'+d.source.key).style('opacity',1);
            wssvg.selectAll('.gtext').filter(s=>s.data.key===d.source.key).style('opacity',1)
                .select('.stext').attr('visibility','visible');
            return true;
        }
    return false;}).style('stroke-opacity',1);

    if (!currentHost.select('.linkLine').empty())
        currentHost.select('.linkLine').datum(d=>d.values)
            .call(scatterConfig.lineConnect)
            .transition()
            .duration(2000)
            .attrTween("stroke-dasharray", tweenDash);
    else
        currentHost.append('path').datum(d=>d.values).call(scatterConfig.lineConnect)
            .style('stroke',d=> {
                return filterConfig.isColorMatchCategory?color(d[0].values[0].topic):colorContinous(nestbyKey.find(e=>e.key === datapoint.key).gap)})
            .transition()
            .duration(2000)
            .attrTween("stroke-dasharray", tweenDash);

    function tweenDash() {
        var l = this.getTotalLength(),
            i = d3.interpolateString("0," + l, l + "," + l);
        return function (t) { return i(t); };
    }
}
function mouseleaveHandel(){
    // let timestep = datain.key;
    // let datapoint = datain.values;
    let cpoint = scsvg.g.selectAll(".gCategory")
        .transition().duration(200)
        .call(activepoint);
    scsvg.g.selectAll(".linkLine").style("opacity",0.5);
    netsvg.selectAll(".linkLineg").style('opacity',1);
    netsvg.selectAll(".linkText").style('opacity',1);
    netsvg.selectAll(".linkGap").style('stroke-opacity',0.5);
    wssvg.selectAll('.gtext').style('opacity',1).select('.stext').attr('visibility',d=>d.placed? "visible": "hidden");
    updateSpike();
}
function initWS () {
    wssvg.attrs({
        ViewBox:"0 0 "+wsConfig.width+" " +wsConfig.height,
        preserveAspectRatio:"xMidYMid meet"
    }).attrs({
        width: wsConfig.width,
        height: wsConfig.height,
    });

    wssvg.append('g')
        .attr('class','axis')
        .attr('transform',`translate(${wsConfig.margin.left},${wsConfig.margin.top})`);

    wssvg.g = wssvg.append('g')
        .attr('class','graph')
        .attr('transform',`translate(${wsConfig.margin.left},${wsConfig.margin.top})`);



    wsConfig.timeScale = d3.scaleTime()
        .rangeRound([0, wsConfig.widthG()]);
    brush = d3.brushX()
        .extent([[0, wsConfig.heightG()-wsConfig.margin.bottom*0.9], [wsConfig.widthG(), wsConfig.heightG()+wsConfig.margin.bottom*0.9]])
        .on("brush end", brushedTime);
    let brushArea = wssvg.g.append("g")
        .attr("class", "brush")
        .call(brush);
    wssvg.xAxis = d3.axisBottom(wsConfig.timeScale);
        // .ticks(d3.timeMonth)
        // .tickPadding(0);
    wssvg.select('.axis').append('g')
        .attr('class','axis--x')
        .attr("transform", "translate(0," + wsConfig.heightG() + ")")
        .call(wssvg.xAxis);

    wsConfig.timeAxisSpike = d3.axisTop(wsConfig.timeScale)
        .tickValues([])
        .tickSize(wsConfig.height)
        .tickFormat(d3.timeFormat("%B %Y"));
    wssvg.select('.axis').append('g')
        .attr('class','axis--x--spike')
        .attr("transform", `translate(0,${wsConfig.heightG()})`)
        .call(customTimeAxis);
    wssvg.g.append('g')
        .attr("class",'wsArea');
}

function drawWS(){
    wsConfig.timeScale.domain(d3.extent(dataRaw, function(d) { return d.timestep; }));
    wssvg.select('.axis--x').call(wssvg.xAxis);
    wssvg.g.select('.brush').call(brush.move, wsConfig.timeScale.range());
}

function brushedTime (){
    console.log(d3.event.sourceEvent!=null?d3.event.sourceEvent.type:"nope!!");
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;

    var d0 = (d3.event.selection || wsConfig.timeScale.range()).map(wsConfig.timeScale.invert),
        d1 = d0.map(d3.timeMonth.round);
    // If empty when rounded, use floor instead.
    if (d1[0] >= d1[1]) {
        d1[0] = d3.timeMonth.floor(d0[0]);
        d1[1] = d3.timeMonth.offset(d1[0]);
    }
    updateAxisX(d1);

    let newTime = d1.map(wsConfig.time2index);
    if ((filterConfig.timeTemp[0] !== newTime[0]) || (filterConfig.timeTemp[1] !== newTime[1])) {
        filterConfig.timeTemp = newTime;
        hightlightWS(d1);
        drawlegend(d1);
    }
        //wssvg.selectAll(".handle--custom").attr("display", null).attr("transform", function(d, i) { return "translate(" + d0[i] + "," + wsConfig.heightG() / 20 + ")"; });
    if (d3.event.sourceEvent && (d3.event.sourceEvent.type === "mouseup" || d3.event.sourceEvent.type === "touchend")) {
        if ((filterConfig.time[0] !== filterConfig.timeTemp[0]) || (filterConfig.time[1] !== filterConfig.timeTemp[1])) {
            filterConfig.time = filterConfig.timeTemp;
            d3.select('.cover').classed('hidden', false);
            let temp = d3.event.target;
            setTimeout(() => {
                recall();
                d3.select(this).call(temp.move, d1.map(wsConfig.timeScale));
            }, 0);
        }
    }

    function updateAxisX(d1){
        wssvg.xAxis.tickValues(d3.merge([wsConfig.timeScale.ticks(),d1]));
        wssvg.select('.axis--x') .call(wssvg.xAxis);
    }
    //
    // let s = d3.event.selection || wsConfig.timeScale.range();
    // let range = s.map(wsConfig.timeScale.invert, wsConfig.timeScale);
}

function filterTop(dataR){
    var cal1 = new Date();
    let data =[];
    let topkeys = [];
    // let timefilter = filterConfig.time.map(wsConfig.time2index.invert);
    // let firstChain = _.chain(dataRaw)
    //     .filter(d=>d.timestep>=timefilter[0]&&d.timestep<=timefilter[1]);
    // filterConfig.limitSudden = 0;
    // firstChain.groupBy("timestep").each(d=>{filterConfig.limitSudden = d3.mean([filterConfig.limitSudden,d3.max(d,e=>e.df)])});
    // filterConfig.limitSudden = filterConfig.limitSudden*0.25;
    // firstChain.filter(d=>d.df>filterConfig.limitSudden)


    // let nettemp = d3.nest()
    //     .key(d=>d.topic).sortValues(d=>d.timestep)
    //     .key(function(d) { return d.timestep; })
    //         .entries(dataR);
    // filterConfig.limitSudden = 0;
    // nettemp.forEach(c=>{
    //     c.values=c.values.slice(filterConfig.time[0],filterConfig.time[1]);
    //     filterConfig.limitSudden = d3.mean([filterConfig.limitSudden,d3.max(c.values,d=>(d3.max(d.values,e=>e.df)))]);
    // });
    // filterConfig.limitSudden = filterConfig.limitSudden*0.25;
    // nettemp.forEach(c=>{
    //     c.values.forEach(t=>{
    //         t.values.sort((a,b)=>(b.df-a.df));
    //         topkeys = d3.merge([topkeys,t.values.slice(0,filterConfig.maxevent).filter(d=>d.df>filterConfig.limitSudden).map(it=>it)]);
    //     });
    // });
    // topkeys.sort((a,b)=>a.df-b.df);
    // d3.nest()
    //     .key(d=>d.key).entries(topkeys).slice(0,filterConfig.maxeventAll).forEach(d=>{
    //     nettemp.forEach(c=>{
    //         c.values.forEach(t=>{
    //             let ins = t.values.find(e=>e.key===d.key);
    //             if (ins != undefined)
    //                 data.push(t.values.find(e=>e.key===d.key));
    //         });
    //     });
    // });

    let nettemp = d3.nest()
        .key(d=>d.timestep).sortKeys((a,b)=>new Date(a)-new Date(b))
            .entries(dataR).slice(filterConfig.time[0],filterConfig.time[1]);
    let tempdata = [];
    nettemp.forEach(d=>{
        d.values.forEach(t=>{
            tempdata.push(t);
        });
    });
    nettemp = d3.nest()
        .key(d=>d.key).rollup(d=>{d.maxsudden = d3.max(d,e=>e.df);
            return d;})
        .entries(tempdata).sort((a,b)=>b.value.maxsudden-a.value.maxsudden).slice(0,filterConfig.maxeventAll);
    nettemp.forEach(d=>{
            d.value.forEach(t=>{
                    data.push(t);
            });
    });
    var cal2 = new Date();
    console.log("--------filterTop----"+(cal2-cal1));
    console.log(data.length);
    return data;
}
function callSum(data){
    sumnet = d3.nest()
            .key(function(d) { return d.timestep; })
            .rollup(d=>{return {f: d3.mean(d,m=>m.f), df: d3.mean(d,m=>m.df), timestep:d[0].timestep}})
            .entries(data);
    sumnet.forEach((d)=>{
            d.values = [d.value];
            delete d.value;
        });
    nestbyKey = d3.nest()
        .key(function(d) { return d.key; }).sortKeys(function(a,b) { return a.timestep-b.timestep})
        .entries(data);
    // scaleX = d3.scaleSymlog().domain(d3.extent(data,d=>d.f)).range([0,1]);
    scaleX = d3.scaleLinear().domain(d3.extent(data,d=>d.f)).range([0,1]);
    //scaleY = d3.scaleSymlog().domain(d3.extent(data,d=>d.df)).range([0,1]);
    // scaleY = d3.scaleSymlog().domain(d3.extent(data,d=>d.df)).range([0,1]);
    scaleY = d3.scaleLinear().domain(d3.extent(data,d=>d.df)).range([0,1]);
    nestbyKey.forEach(key => {
        key.gap = integration (key.values.map(d=>normalize(d)),sumnet.map(d=>normalize(d.values[0])));
    });
    colorContinous = d3.scaleSequential(d3.interpolateSpectral)
        .domain(d3.extent(nestbyKey,d=>d.gap).reverse());
}

function initNetgap(){
    netConfig.margin = ({top: 0, right: 0, bottom: 0, left: 0});
    netConfig.width = widthSvg;
    netConfig.height = heightSvg;
    netsvg
    //     .attrs({
    //     // viewBox:  [-widthSvg*scalezoom / 2, -heightSvg*scalezoom / 2, widthSvg*scalezoom, heightSvg*scalezoom],
    //     viewBox:  [0,0, netConfig.widthView(), netConfig.heightView()],
    //     preserveAspectRatio:"xMidYMid meet"
    // })
        .attrs({
        width: netConfig.width,
        height: netConfig.height,
        // overflow: "visible",

    });
    const netsvgG = netsvg.append("g")
        .attr('class','graph')
        .attr('transform',`translate(${netConfig.margin.left},${netConfig.margin.top})`);

    netsvgG.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.9)
        .attr("stroke-width", 1)
        .attr('class','linkgroup');
    netConfig.g = netsvgG ;
    function zoomed() {
        netConfig.g.attr("transform", d3.event.transform);
    }
    var zoom = d3.zoom()
        // .scaleExtent([1/netConfig.scalezoom, 40])
        .scaleExtent([0.25, 40])
        //.translateExtent([[-netConfig.width/2,-netConfig.height/2], [netConfig.width*1.5,netConfig.height*1.5]])
        .on("zoom", zoomed);
    netsvg.call(zoom);
    netsvg.call(tip);
    zoom.scaleTo(netsvg, 1/netConfig.scalezoom);
    netsvg.call(zoom   .translateTo, netConfig.widthG() / 2,netConfig.heightG() / 2);
    var collisionForce = rectCollide()
        .size(function (d) {
            return [d.size.w, d.size.h] }).strength(0.8);
    netConfig.scalerevse = d3.scalePow().exponent(5).range([netConfig.colider(),netConfig.colider()]);
    netConfig.invertscale =  d3.scalePow().exponent(5).range([0.95,0.95]);
    netConfig.clusterscale =  d3.scalePow().exponent(1).range([0.5,0.1]);
    netConfig.clusterscale2 =  d3.scalePow().exponent(1).range([0.1,1]);
    netConfig.simulation = d3.forceSimulation(netConfig.nodes)
        .velocityDecay(0.5)
        .alphaDecay(0)
        .force("link", d3.forceLink(netConfig.links).id(d => d.id)
            .distance(d=>netConfig.scalerevse(d.value))
            // .distance(d=>netConfig.scalerevse(d.value))
            // .strength(d=>netConfig.invertscale(d.value)))
            .strength(d=>Math.pow(netConfig.invertscale(d.value), 10)))
        // .force("link", d3.forceLink(netConfig.links).id(d => d.id).distance(d=>netConfig.scalerevse(d.value)).strength(d=>netConfig.invertscale(d.value)))
        .force("charge", d3.forceManyBody().strength(-250).distanceMin(4 * netConfig.colider()))//.distanceMin(netConfig.colider()*2).strength(-5))
        // .force('collision',d3.forceCollide().radius(2 * netConfig.colider()).strength(1))
        .force('collision',collisionForce)
        // .force('collision2',d3.forceCollide(netConfig.colider())
        //     .strength(1)
        //     .iterations(1))
        // .force("gravity2", d3.forceManyBody().strength(2))//.distanceMax(netConfig.widthG()/4))
        // .force("gravity", d3.forceRadial().radius(d=>{
        //     return netConfig.widthG() / 2*netConfig.clusterscale(d.connected);}).x(netConfig.widthG() / 2).y( netConfig.heightG() / 2).strength(d=> netConfig.clusterscale2(d.connected)*0.02) )//.distanceMax(netConfig.widthG()/3).distanceMin(netConfig.colider()*2))
        .force("x", d3.forceX(netConfig.widthG() / 2))
        .force("y", d3.forceY(netConfig.heightG() / 2))
        // .force("center", d3.forceCenter(netConfig.widthG() / 2, netConfig.heightG() / 2))
        .on("tick", () => {
            netConfig.link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

            netConfig.node
            .attr("transform", d=>{

                // d.x = Math.max(netConfig.width/10, Math.min(netConfig.widthG() - netConfig.width/5, d.x));
                // d.y = Math.max(netConfig.height/10, Math.min(netConfig.heightG() - netConfig.height/5, d.y));
                let smallgaph = netConfig.smallgrapSize();
                // d.x = Math.max(smallgaph-netConfig.widthG()*0.25, Math.min(netConfig.widthG()*1.25 - smallgaph/2, d.x));
                // d.y = Math.max(smallgaph-netConfig.heightG()*0.25, Math.min(netConfig.heightG()*1.25 - smallgaph/2, d.y));
                return `translate(${d.x},${d.y-smallgaph})`});
                //return `translate(${d.x- netConfig.width/10},${d.y- netConfig.height/10})`});
            netConfig.nodeText.attr("x", d => d.x)
                .attr("y", d => d.y)
    });


}

function drawNetgapHuff(nodenLink,colorby){

    netConfig.simulation.stop();

    let widthNet= netConfig.widthG();
    let heightNet= netConfig.heightG();


    function cutbyIQRv3(multi,maxlink) {
        nodenLink.links.sort((a, b) => a.value - b.value);
        nodenLink.nodes.sort((a, b) => a.value - b.value);
        let templarray = nodenLink.links.map(d => d.value);
        const q1 = d3.quantile(templarray, 0.25);
        const q3 = d3.quantile(templarray, 0.75);
        const qmean = d3.median(templarray);
        const iqr = q3 - q1;
        let filtered= nodenLink.links.filter(d=> (d.value<(q3+iqr*multi)));
        let tempLinks=[];
        let tempc =d3.nest()
            .key(d=>d.source)
            .rollup(d=>{
                let nv =nodenLink.nodes.find(e=>e.id === d[0].source).value;
                if (nv>q3)
                    return d.slice(0,1).filter(d=> (d.value<qmean));
                if (nv>q1)
                    return d.slice(0,maxlink-1).filter(d=> (d.value<q1));
                return d.slice(0,maxlink);})
            .entries(filtered);
        tempc.forEach(d=>{tempLinks = d3.merge([tempLinks,d.value])});
        return tempLinks;
    }
    const cutedlinks = cutbyIQRv3(1.5, 3);
    const links = cutedlinks.map(d => Object.create(d));
    const nodes = nodenLink.nodes.map(d => {
        let temp = Object.create(d);
        temp.connected = cutedlinks.filter(e=>e.source===d.id||e.target===d.id).length;
        temp.key = d.id;
        temp.gap = d.value;
        temp.text = d.extra.text;
        temp.topic = d.extra.topic;
        return temp;
    });
    netConfig.clusterscale.domain(d3.extent(nodes,d=>d.connected));
    netConfig.clusterscale2.domain(d3.extent(nodes,d=>d.connected));
    netConfig.scalerevse.domain(d3.extent(links,d=>d.value));
    netConfig.invertscale.domain(d3.extent(nodes,d=>d.value));
    // let fontscale = d3.scaleLog().domain(d3.extent(nodenLink.nodes, d=>d.value)).range(netConfig.fontRange);

    let fontscale = d3.scaleLinear().domain(d3.extent(nodenLink.nodes, d=>d3.max(d.values,e=>e.values[0].f))).range(netConfig.fontRange);


    const netsvgG = netConfig.g;
    const lineScale = d3.scaleLinear().range([0.5,3]).domain(d3.extent(links,d=>d.value));
    netConfig.link = netsvgG.select('.linkgroup')
        .selectAll(".linkGap")
        .data(links).join("line")
        // .enter().append("line")
        .attr("class","linkGap")
        .attr("stroke", 'black')
        .attr("stroke-width", d => lineScale(d.value));


    // DATA JOIN
    netConfig.node = netsvgG
        .selectAll(".linkLineg")
        .data(nodes);
    // UPDATE
    netConfig.node
        .attr('id',(d,i)=>'mini'+nodes[i].key)
        .style('pointer-events','auto');
    // ENTER
    let newnodes = netConfig.node
        .enter().append('g')
        .attr('class','linkLineg')
        .attr('id',(d,i)=>'mini'+nodes[i].key)
        .style('pointer-events','auto');
    // EXIT
    // Remove old elements as needed.
    netConfig.node.exit().remove();

    netConfig.node.select('path')
        .style('stroke',d=>
            filterConfig.isColorMatchCategory?color(d.topic):colorContinous(d.gap))
        .datum(d=>d.values)
        .call(d=>lineConnect(d,1))
        .attr('stroke-width',0.5);

    let newsvg = newnodes
        .append('svg')
        .attrs({
            x:-netConfig.smallgrapSize()*0.2,
            y:-netConfig.smallgrapSize()*0.2,
            width: netConfig.smallgrapSize()*1.4,
            height: netConfig.smallgrapSize()*1.4
        });

    newsvg.append('path')
        .style('stroke',d=>
            filterConfig.isColorMatchCategory?color(d.topic):colorContinous(d.gap))
        .datum(d=>d.values)
        .call(d=>lineConnect(d,1))
        .attr('stroke-width',0.5);
    newsvg.append("title");
    // newnodes.append("text");

    netConfig.node = netsvgG
        .selectAll(".linkLineg");

    netConfig.node.select("title")
        .text(d => d.id);

    // netConfig.node.select("text")
    //     .text(d => d.text)
    //     .attrs({
    //         x:0,
    //         y:netConfig.smallgrapSize(),
    //         dy: ".30em"
    //     }).style('font-size',d=>fontscale(d.value));
        // }).style('font-size',d=>fontscale(d3.mean(d.values,e=>e.values[0].f)));

    // netConfig.node.select('path')
    netConfig.node
        .style('pointer-events','auto')
        .on('mouseover',(dd)=>{
            let maxSudden = d3.max(dd.values,d=>d.values[0].df);
            let maxSuddenPoint = dd.values.find(d=>d.values[0].df===maxSudden);
            mouseoverHandel(maxSuddenPoint);
            netConfig.simulation.stop();
            netsvg.selectAll(".linkLineg").style('opacity',0.5);
            d3.select("#mini"+dd.key).style('opacity',1);
            d3.selectAll(".linkGap").style('stroke-opacity',0.5);
            let connect = d3.selectAll(".linkGap").filter(d=>d.source.key===dd.key||d.target.key===dd.key).style('stroke-opacity',1);
            connect.data().forEach(d=>{
                let id = "#mini"+(d.source.key!== dd.key?d.source.key:d.target.key);
                console.log(id);
                d3.select(id).style('opacity',1);
            });
            tip.show({values: [{key:dd.key,topic:dd.topic,text:dd.text, connect: connect.data()}]});})
        .on('mouseleave',(dd)=>{
            mouseleaveHandel();
            netConfig.simulation.restart();

            tip.hide()})
        .call(dragForce(netConfig.simulation));


    // DATA JOIN
    netConfig.nodeText = netsvgG
        .selectAll(".linkText")
        .data(nodes);
    // UPDATE
    netConfig.nodeText
        .attr('id',(d,i)=>'text'+nodes[i].key)
        .style('pointer-events','auto');
    // ENTER
    netConfig.nodeText
        .enter().append('text')
        .attr('class','linkText')
        .attr('id',(d,i)=>'text'+nodes[i].key)
        .style('pointer-events','auto');
    // EXIT
    // Remove old elements as needed.
    netConfig.nodeText.exit().remove();


    netConfig.nodeText = netsvgG
        .selectAll(".linkText");

    netConfig.nodeText
        .text(d => d.text)
        .attrs({
            x:0,
            y:netConfig.smallgrapSize(),
            // dy: ".30em"
        // }).style('font-size',d=>fontscale(d.gap));
    }).style('font-size',d=>{
        return fontscale(d3.max(d.values,e=>e.values[0].df))+'px'});

    // netConfig.node.select('path')
    netConfig.nodeText
        .style('pointer-events','auto')
        .on('mouseover',(dd)=>{
            let maxSudden = d3.max(dd.values,d=>d.values[0].df);
            let maxSuddenPoint = dd.values.find(d=>d.values[0].df===maxSudden);
            mouseoverHandel(maxSuddenPoint);
            netConfig.simulation.stop();
            netsvg.selectAll(".linkLineg").style('opacity',0.5);
            d3.select("#mini"+dd.key).style('opacity',1);
            d3.selectAll(".linkGap").style('stroke-opacity',0.5);
            let connect = d3.selectAll(".linkGap").filter(d=>d.source.key===dd.key||d.target.key===dd.key).style('stroke-opacity',1);
            connect.data().forEach(d=>{
                let id = "#mini"+(d.source.key!== dd.key?d.source.key:d.target.key);
                console.log(id);
                d3.select(id).style('opacity',1);
            });
            tip.show({values: [{key:dd.key,topic:dd.topic,text:dd.text, connect: connect.data()}]});})
        .on('mouseleave',(dd)=>{
            mouseleaveHandel();
            netConfig.simulation.alphaTarget(.3).restart();

            netsvg.selectAll(".linkLineg").style('opacity',1);
            netsvg.selectAll(".linkGap").style('stroke-opacity',0.5);
            tip.hide()})
        .call(dragForce(netConfig.simulation));


    netConfig.nodeText.nodes().forEach(d=>{
        let e= d3.select(d).node().getBoundingClientRect();
        d.__data__.size = {w: e.width,h: e.height*2};
    });

    netConfig.simulation.nodes(nodes);
    netConfig.simulation.force("link").links(links);
    netConfig.simulation.restart()
    //invalidation.then(() => simulation.stop());
}

function dragForce (simulation) {

    function dragstarted(d) {
        // if (!d3.event.active) simulation.alphaTarget(.03).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        // if (!d3.event.active) simulation.alphaTarget(.5);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}
function renderWS (data){
    const cal1 = new Date();
    // d3.selectAll(".wordStreamDiv").selectAll('svg').remove();
    // handledata(data);
    let TermwDay = d3.nest().key(d=>d.timestep)
        .key(d=>d.topic)
        .rollup(e=>{return e.filter(d=>d.f).map(d=> {
            d.color = filterConfig.isColorMatchCategory?undefined:colorContinous(nestbyKey.find(it=>it.key===d.key).gap);
            return {
            frequency: Math.sqrt(d.frequency),
                sudden: d.sudden,
                text: d.text,
                topic: d.topic,
                data:d
        }})})
        .entries(data);

    TermwDay.forEach(t=>{
        t.words ={};
        t.values.forEach(d=>{
            t.words[d.key] = d.value;
        });
        delete t.values;
    });
    TermwDay.sort((a,b)=>new Date(a.key)-new Date(b.key));
    wsConfig.wstep = wsConfig.widthG()/TermwDay.length;
    const cal2 = new Date();
    console.log('Word Stream calculate time: '+(cal2-cal1));
    // parse the date / time

    var configwc = {width: wsConfig.widthG(),height: wsConfig.heightG(),margin:{top: 20, right: 0, bottom: 20, left: 0}};
    myWordCloud = wordCloud('.wsArea',configwc);

    myWordCloud.update(TermwDay);

}

function hightlightWS(d1){
    d3.selectAll('.stext')
        .classed('disableWord',false)
        .filter(d=> {
            let cT = d.data.timestep;
            let TR = d1||filterConfig.time.map(wsConfig.time2index.invert);
            return (cT < TR[0]) || (cT > TR[1]); //in range time
        }).classed('disableWord',true);
}

// ui part
function openNav() {
    d3.select("#mySidenav").classed("sideIn",true);
    d3.select("#Maincontent").classed("sideIn",true);
    // _.delay(resetSize, 500);
}

function closeNav() {
    d3.select("#mySidenav").classed("sideIn",false);
    d3.select("#Maincontent").classed("sideIn",false);
    // _.delay(resetSize, 500);
}

