var serviceList = ["Huff"];
var serviceLists = [{text: "Huff", id: 0,
    sub:[]}];
var serviceListattr = ["arr"];
var chosenService = 0;

var huff= function (startCut,endCut) {
    // return d3.json("src/data/Huffv2.json").then((data)=>{
    return d3.json("src/data/Huffv3.json").then((data)=>{
        // let timestep = d3.nest().key(d=>d.timestep).entries(data).length;
        let timestep = data[0].values[0].value.length;
        let timerange = d3.range(timestep).map(function(d) { return new Date(2007, d);});
        let dataRead = [];
        data.forEach(topics=>{
            topics.values.forEach(d=>d.value.forEach(it=>{
                let timestepIt = timerange[it.timestep];
                if ((timestepIt>(startCut||0)) &&(timestepIt<(endCut||Infinity)))
                    dataRead.push({key: d.key.replace(/'|&/gi, ""),
                        topic: topics.key,
                        text: it.text,
                        f: it.frequency,
                        frequency: it.frequency,
                        sudden:it.sudden,
                        timestep: timestepIt,
                        df: it.sudden});
            }));
        });
        return dataRead;
        // return data.map(d=>{
        //     return {key: d.fam.replace("'", ""),
        //     topic: d.topic,
        //     text: d.text,
        //     f: ~~d.frequency,
        //     timestep: timerange[~~d.timestep],
        //     df: ~~d.sudden}
        // });
    });
}

var gab = function (startCut,endCut) {
    // return d3.json("src/data/Huffv2.json").then((data)=>{
    return d3.json("src/data/gab_crime.json").then((data)=>{
        // let timestep = d3.nest().key(d=>d.timestep).entries(data).length;
        // let timestep = data[0].values[0].value.length;
        // let timerange = d3.range(timestep).map(function(d) { return new Date(2007, d);});
        let dataRead = [];
        data.forEach((it=>{
            it.timestep = new Date(it.timestep);
            if (it.text!=="mydadisfbi")
            dataRead.push({
                f:it.s,
                df:it.ds,
                frequency: it.f,
                sudden:it.df,
                key: it.key,
                text: it.text,
                topic: it.topic,
                timestep: it.timestep
            });
            }));
        return dataRead;
        // return data.map(d=>{
        //     return {key: d.fam.replace("'", ""),
        //     topic: d.topic,
        //     text: d.text,
        //     f: ~~d.frequency,
        //     timestep: timerange[~~d.timestep],
        //     df: ~~d.sudden}
        // });
    });
}

var adl = function (startCut,endCut) {
    // return d3.json("src/data/Huffv2.json").then((data)=>{
    return d3.json("src/data/adl_output.json").then((data)=>{
        // let timestep = d3.nest().key(d=>d.timestep).entries(data).length;
        // let timestep = data[0].values[0].value.length;
        // let timerange = d3.range(timestep).map(function(d) { return new Date(2007, d);});
        let dataRead = [];
        data.forEach(ww=>{
            d3.keys(ww.words).forEach(topic=>{
                ww.words[topic].forEach(d=>{
                    dataRead.push({key: ("_"+d.text+"-"+topic).replace(/'|&| |\//gi, ""),
                        topic: topic,
                        text: d.text,
                        f: d.frequency,
                        frequency: d.frequency,
                        sudden: d.sudden,
                        timestep: new Date(ww.date),
                        df: d.sudden});
                })
            })
        });
        return dataRead;
        // return data.map(d=>{
        //     return {key: d.fam.replace("'", ""),
        //     topic: d.topic,
        //     text: d.text,
        //     f: ~~d.frequency,
        //     timestep: timerange[~~d.timestep],
        //     df: ~~d.sudden}
        // });
    });
}