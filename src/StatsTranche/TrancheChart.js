import moment from 'moment';
import { Bar } from '@nivo/bar';
import { Line } from '@nivo/line';
import React, { Component } from 'react';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import DashboardCard from '../DashboardCard/DashboardCard';
import CustomTooltip from '../CustomTooltip/CustomTooltip';
import CustomTooltipRow from '../CustomTooltip/CustomTooltipRow';

class TrancheChart extends Component {
    state = {
        chartProps:{},
        chartType:null,
        chartData:null,
        chartWidth:null
    };

    async componentDidMount() {
        this.setState({
            chartData:null,
            chartType:null,
            chartProps:null,
        });
        this.loadUtils();
        this.loadApiData();
    }

    async componentDidUpdate(prevProps) {
        const showAdvancedChanged = prevProps.showAdvanced !== this.props.showAdvanced;
        const apiResults_aa_Changed = prevProps.apiResults_aa !== this.props.apiResults_aa;
        const apiResults_bb_Changed = prevProps.apiResults_bb !== this.props.apiResults_bb;
        const apiResultsChanged = prevProps.apiResults !== this.props.apiResults;
        const tokenChanged = prevProps.selectedToken !== this.props.selectedToken || JSON.stringify(prevProps.tokenConfig) !== JSON.stringify(this.props.tokenConfig);
        if (apiResultsChanged || showAdvancedChanged || tokenChanged||apiResults_aa_Changed||apiResults_bb_Changed){
            this.componentDidMount();
        }
    }

    // Utils
    functionsUtil = null;
    loadUtils(){
        if (this.functionsUtil){
            this.functionsUtil.setProps(this.props);
        } else {
            this.functionsUtil = new FunctionsUtil(this.props);
        }
    }

    parseAum = value => {
        return (parseInt(value)>=1000 ? parseFloat(value/1000).toFixed(1)+'K' : parseFloat(value) )+' '+this.props.selectedToken
    }

    loadApiData = async () => {
        console.log("HERE",this.props.apiResults_aa)

        if (!this.props.tokenConfig || !this.props.selectedToken || !this.props.chartMode || (!this.props.apiResults&&!this.props.apiResults_aa)){
            console.log("Failed",this.props.tokenConfig,"TOKEN",this.props.selectedToken,"CHARTMODE",this.props.chartMode,this.props.apiResults,this.props.apiResults_aa)
            return false;
        }
        console.log("Success",this.props.tokenConfig,"TOKEN",this.props.selectedToken,"CHARTMODE",this.props.chartMode,this.props.apiResults,this.props.apiResults_aa)
        const maxGridLines = 4;
        const tranchesConfig = this.functionsUtil.getGlobalConfig(['tranches']);
        const apiResults = this.props.apiResults;
        const apiResults_aa=this.props.apiResults_aa;
        const apiResults_bb=this.props.apiResults_bb;
        const apiResults_unfiltered = this.props.apiResults_unfiltered;
        const totalItems = apiResults_aa ? apiResults_aa.length : apiResults.length;
        //const protocols = Object.assign([],this.props.tokenConfig.protocols);
        // const compoundProtocol = this.props.tokenConfig.protocols.find( p => (p.name === 'compound'));

        //const versionInfo = globalConfigs.stats.versions[this.props.idleVersion];

        //let keys = {};
        //let tempData = {};
        let gridYStep = 0;
        let itemIndex = 0;
        let daysCount = 0;
        let chartData = [];
        let chartProps = {};
        let chartType = Line;
        let gridYValues = [];
        let maxChartValue = 0;
        let axisBottomIndex = 0;
        let daysFrequency = null;
        //let idleChartData = null;
        let firstIdleBlock = null;
        let axisBottomMaxValues = 12;

        switch (this.props.chartMode){
            case 'PRICE_TRANCHE':
                // let prevTokenPrice = null;
                maxChartValue = 0;
                let firstPriceAA = null;
                let firstPriceBB = null;
                let chartDataAA=null;
                let chartDataBB=null;
                let firstBlock=null;

                chartDataAA = apiResults_aa.map((d,i) => {
                    let y = 0;
                    let apy = 0;
                    let days = 0;
                    const x = moment(d.timeStamp*1000).format("YYYY/MM/DD HH:mm");
                    const tokenPrice = this.functionsUtil.fixTokenDecimals(d.virtualPrice,this.props.tokenConfig.decimals);

                    if (!firstPriceAA){
                        firstPriceAA = tokenPrice;
                    } else {
                        y = parseFloat(tokenPrice.div(firstPriceAA).minus(1).times(100));

                        days = (d.timeStamp-apiResults_aa[0].timeStamp)/86400;
                        const earning = tokenPrice.div(firstPriceAA).minus(1).times(100);
                        apy = earning.times(365).div(days).toFixed(2);
                        // console.log(firstTokenPrice.toString(),tokenPrice.toString(),earning.toString(),days,y,apy);
                    }

                    if (firstBlock === null){
                        firstBlock = parseInt(d.blockNumber);
                    }

                    maxChartValue = Math.max(maxChartValue,y);

                    const itemPos = Math.floor(itemIndex/totalItems*100);
                    const blocknumber = parseInt(d.blockNumber);
                    itemIndex++;

                    return { x, y, apy, blocknumber, itemPos };
                });

                chartDataBB = apiResults_bb.map((d,i) => {
                    let y = 0;
                    let apy = 0;
                    let days = 0;
                    const x = moment(d.timeStamp*1000).format("YYYY/MM/DD HH:mm");
                    const tokenPrice = this.functionsUtil.fixTokenDecimals(d.virtualPrice,this.props.tokenConfig.decimals);

                    if (!firstPriceBB){
                        firstPriceBB = tokenPrice;
                    } else {
                        y = parseFloat(tokenPrice.div(firstPriceBB).minus(1).times(100));

                        days = (d.timeStamp-apiResults_bb[0].timeStamp)/86400;
                        const earning = tokenPrice.div(firstPriceBB).minus(1).times(100);
                        apy = earning.times(365).div(days).toFixed(2);

                        // console.log(firstTokenPrice.toString(),tokenPrice.toString(),earning.toString(),days,y,apy);
                    }

                    if (firstIdleBlock === null){
                        firstIdleBlock = parseInt(d.blockNumber);
                    }

                    maxChartValue = Math.max(maxChartValue,y);

                    const itemPos = Math.floor(itemIndex/totalItems*100);
                    const blocknumber = parseInt(d.blockNumber);

                    itemIndex++;

                    return { x, y, apy, blocknumber, itemPos };
                });

                gridYStep = parseFloat(maxChartValue/maxGridLines);
                gridYValues = [0];
                for (let i=1;i<=5;i++){
                    gridYValues.push(i*gridYStep);
                }
                chartDataAA.splice(0,1);


                chartData.push({
                    id:this.props.tokenConfig.AA.label,
                    color: tranchesConfig.AA.color.hex,
                    data: chartDataAA
                });

                chartData.push({
                    id:this.props.tokenConfig.BB.label,
                    color: tranchesConfig.BB.color.hex,
                    data: chartDataBB
                });


                // Set chart type
                chartType = Line;

                axisBottomIndex = 0;
                axisBottomMaxValues = 12;
                daysCount = moment(chartDataAA[chartDataAA.length-1].x,"YYYY/MM/DD HH:mm").diff(moment(chartDataAA[0].x,"YYYY/MM/DD HH:mm"),'days');
                daysFrequency = Math.max(1,Math.ceil(daysCount/axisBottomMaxValues));

                chartProps = {
                    xScale:{
                        type: 'time',
                        format: '%Y/%m/%d %H:%M',
                        // precision: 'day',
                    },
                    xFormat:'time:%b %d %H:%M',
                    yFormat:value => parseFloat(value).toFixed(3)+'%',
                    yScale:{
                        type: 'linear',
                        stacked: false,
                        // min: 1
                    },
                    axisLeft:{
                        legend: '',
                        tickSize: 0,
                        orient: 'left',
                        tickPadding: 10,
                        tickRotation: 0,
                        legendOffset: -70,
                        tickValues:gridYValues,
                        legendPosition: 'middle',
                        format: value => parseFloat(value).toFixed(2)+'%',
                    },
                    axisBottom: this.props.isMobile ? null : {
                        legend: '',
                        tickSize: 0,
                        format: (value) => {
                            if (axisBottomIndex++ % daysFrequency === 0){
                                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
                            }
                        },
                        tickPadding: 10,
                        legendOffset: 0,
                        orient: 'bottom',
                        tickValues:`every day`,
                        legendPosition: 'middle',
                    },
                    gridYValues,
                    pointSize:0,
                    useMesh:true,
                    animate:false,
                    pointLabel:"y",
                    curve:'monotoneX',
                    enableArea:false,
                    enableSlices:'x',
                    enableGridX:false,
                    enableGridY:true,
                    pointBorderWidth:1,
                    colors:d => d.color,
                    pointLabelYOffset:-12,
                    legends:[
                        {
                            itemHeight: 18,
                            symbolSize: 10,
                            itemsSpacing: 5,
                            direction: 'row',
                            anchor: 'bottom-left',
                            symbolShape: 'circle',
                            itemTextColor: this.props.theme.colors.legend,
                            itemWidth: this.props.isMobile ? 70 : 160,
                            translateX: this.props.isMobile ? -35 : 0,
                            translateY: this.props.isMobile ? 40 : 65,
                            effects: [
                                {
                                    on: 'hover',
                                    style: {
                                        itemTextColor: this.props.themeMode === 'light' ? '#000' : '#fff'
                                    }
                                }
                            ]
                        }
                    ],
                    theme:{
                        axis: {
                            ticks: {
                                text: {
                                    fontSize: this.props.isMobile ? 12: 14,
                                    fontWeight:600,
                                    fill:this.props.theme.colors.legend,
                                    fontFamily: this.props.theme.fonts.sansSerif
                                }
                            }
                        },
                        grid: {
                            line: {
                                stroke: this.props.theme.colors.lineChartStroke, strokeDasharray: '10 6'
                            }
                        },
                        legends:{
                            text:{
                                fontSize: this.props.isMobile ? 12: 14,
                                fill:this.props.theme.colors.legend,
                                fontWeight:500,
                                fontFamily: this.props.theme.fonts.sansSerif
                            }
                        }
                    },
                    pointColor:{ from: 'color', modifiers: []},
                    margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 65 } : { top: 20, right: 40, bottom: 80, left: 80 },
                    sliceTooltip:(slideData) => {
                        const { slice } = slideData;
                        const point = slice.points[0];
                        return (
                            <CustomTooltip
                                point={point}
                            >
                                {
                                    typeof slice.points === 'object' && slice.points.length &&
                                    slice.points.map(point => {
                                        const protocolName = point.serieId;
                                        const protocolEarning = point.data.yFormatted;
                                        const protocolApy = point.data.apy;
                                        return (
                                            <CustomTooltipRow
                                                key={point.id}
                                                label={protocolName}
                                                color={point.color}
                                                value={`${protocolEarning} <small>(${protocolApy}% APY)</small>`}
                                            />
                                        );
                                    })
                                }
                            </CustomTooltip>
                        );
                    }
                };
                break;
            case 'VOL_TRANCHE':
                let divergingData = {};

                const startTimestampA = parseInt(apiResults_unfiltered[0].timeStamp);
                const endTimestampA = parseInt(moment()._d.getTime()/1000);

                for (let timestamp=startTimestampA;timestamp<=endTimestampA;timestamp+=86400){
                    const date = moment(timestamp*1000).format("YYYY/MM/DD");
                    if (!divergingData[date]){
                        divergingData[date] = {
                            date,
                            timestamp,
                            deposits: 0,
                            redeems: 0
                        };
                    }
                }

                let lastRow = null;
                apiResults_unfiltered.forEach(row => {
                    const date = moment(row.timeStamp*1000).format("YYYY/MM/DD");
                    const idleTokens = this.functionsUtil.fixTokenDecimals(row.totalSupply,18);

                    if (!divergingData[date]){
                        divergingData[date] = {
                            date,
                            timestamp:row.timeStamp,
                            deposits: 0,
                            redeems: 0
                        };
                    }

                    if (lastRow){
                        const idleTokensPrev = this.functionsUtil.fixTokenDecimals(lastRow.totalSupply,18);
                        const idleTokensDiff = !idleTokens.eq(idleTokensPrev);
                        if (idleTokensDiff){
                            const diff = idleTokens.minus(idleTokensPrev);
                            // Deposits
                            if (diff.gte(0)){
                                divergingData[date].deposits+=parseFloat(diff);
                                maxChartValue = Math.max(maxChartValue,divergingData[date].deposits);
                            } else {
                                divergingData[date].redeems+=parseFloat(diff);
                                maxChartValue = Math.max(maxChartValue,Math.abs(divergingData[date].deposits));
                            }
                        }

                    } else {
                        divergingData[date].deposits+=parseFloat(idleTokens);
                    }

                    lastRow = row;
                });

                chartData = Object.values(divergingData).filter(v => {
                    return (!this.props.startTimestamp || v.timestamp>=this.props.startTimestamp) && (!this.props.endTimestamp || v.timestamp<=this.props.endTimestamp);
                }).sort((a,b) => (a.timestamp < b.timestamp ? -1 : 1));

                let maxRange = 0;
                chartData.forEach(v => {
                    maxRange = Math.max(maxRange,Math.abs(v.deposits),Math.abs(v.redeems));
                });

                chartType = Bar;

                gridYStep = parseFloat(maxChartValue/maxGridLines);
                gridYValues = [0];
                for (let i=1;i<=5;i++){
                    gridYValues.push(i*gridYStep);
                }

                axisBottomIndex = 0;
                axisBottomMaxValues = 6;
                daysCount = moment(chartData[chartData.length-1].date,"YYYY/MM/DD").diff(moment(chartData[0].date,"YYYY/MM/DD"),'days');
                daysFrequency = Math.max(1,Math.ceil(daysCount/axisBottomMaxValues));

                chartProps = {
                    indexBy: 'date',
                    enableLabel: false,
                    minValue:-maxRange,
                    maxValue:maxRange,
                    label: d => {
                        return Math.abs(d.value);
                    },
                    axisBottom: this.props.isMobile ? null : {
                        tickSize: 0,
                        legend: '',
                        tickPadding: 15,
                        orient: 'bottom',
                        legendOffset: 0,
                        tickValues: 'every day',
                        format: (value) => {
                            if (axisBottomIndex++ % daysFrequency === 0){
                                return moment(value,'YYYY/MM/DD').format('MMM DD')
                            }
                        },
                        legendPosition: 'middle',
                    },
                    axisLeft: null,
                    axisRight: {
                        legend: '',
                        tickSize: 0,
                        orient: 'left',
                        tickPadding: 10,
                        tickRotation: 0,
                        legendOffset: -70,
                        tickValues:8,
                        legendPosition: 'middle',
                        format: v => this.functionsUtil.abbreviateNumber(Math.abs(v),0)
                    },
                    markers: [
                        {
                            axis: 'y',
                            value: 0,
                            lineStyle: { strokeOpacity: 0 },
                            textStyle: { fill: this.props.theme.colors.transactions.action.deposit },
                            legend: 'deposits',
                            legendPosition: 'top-left',
                            legendOrientation: 'vertical',
                            // legendOffsetY: 120,
                            legendOffsetX: -20
                        },
                        {
                            axis: 'y',
                            value: 0,
                            lineStyle: { stroke: this.props.theme.colors['dark-gray'], strokeDasharray: '5 3' },
                            textStyle: { fill: this.props.theme.colors.transactions.action.redeem },
                            legend: 'redeems',
                            legendPosition: 'bottom-left',
                            legendOrientation: 'vertical',
                            // legendOffsetY: 120,
                            legendOffsetX: -20
                        },
                    ],
                    keys:['deposits','redeems'],
                    padding:0.4,
                    colors:[this.props.theme.colors.transactions.action.deposit, this.props.theme.colors.transactions.action.redeem],
                    labelTextColor: 'inherit:darker(1.4)',
                    labelSkipWidth: 16,
                    labelSkipHeight: 16,
                    pointSize:0,
                    useMesh:true,
                    animate:false,
                    pointLabel:"y",
                    curve:'linear',
                    enableArea:false,
                    enableSlices:'x',
                    enableGridX:false,
                    enableGridY:true,
                    pointBorderWidth:1,
                    pointLabelYOffset:-12,
                    legends:[
                        {
                            dataFrom:'keys',
                            itemWidth: this.props.isMobile ? 80 : 100,
                            itemHeight: 18,
                            translateX: 0,
                            translateY: this.props.isMobile ? 40 : 65,
                            symbolSize: 10,
                            itemsSpacing: 0,
                            direction: 'row',
                            anchor: 'bottom-left',
                            symbolShape: 'circle',
                            itemTextColor: this.props.theme.colors.legend,
                            effects: [
                                {
                                    on: 'hover',
                                    style: {
                                        itemTextColor: this.props.themeMode === 'light' ? '#000' : '#fff'
                                    }
                                }
                            ]
                        }
                    ],
                    theme:{
                        axis: {
                            ticks: {
                                text: {
                                    fontSize: this.props.isMobile ? 12: 14,
                                    fontWeight:600,
                                    fill:this.props.theme.colors.legend,
                                    fontFamily: this.props.theme.fonts.sansSerif
                                }
                            }
                        },
                        grid: {
                            line: {
                                stroke: this.props.theme.colors.lineChartStroke, strokeDasharray: '10 6'
                            }
                        },
                        legends:{
                            text:{
                                fontWeight:500,
                                fill:this.props.theme.colors.legend,
                                textTransform:'capitalize',
                                fontFamily: this.props.theme.fonts.sansSerif,
                                fontSize: this.props.isMobile ? 12: 14
                            }
                        },
                        tooltip:{
                            container:{
                                boxShadow:null,
                                background:null
                            }
                        }
                    },
                    pointColor:{ from: 'color', modifiers: []},
                    margin: this.props.isMobile ? { top: 20, right: 50, bottom: 45, left: 50 } : { top: 20, right: 70, bottom: 70, left: 50 },
                    tooltip:(data) => {
                        const xFormatted = this.functionsUtil.strToMoment(data.data.timestamp*1000).format('MMM DD HH:ss');
                        const point = {
                            id:data.id,
                            data:{
                                xFormatted
                            }
                        };
                        const depositFormatted = this.functionsUtil.abbreviateNumber(data.data.deposits,2)+' '+this.props.selectedToken;
                        const redeemFormatted = this.functionsUtil.abbreviateNumber(data.data.redeems,2)+' '+this.props.selectedToken;
                        return (
                            <CustomTooltip
                                point={point}
                            >
                                <CustomTooltipRow
                                    label={'Deposits'}
                                    color={this.props.theme.colors.deposit}
                                    value={depositFormatted}
                                />
                                <CustomTooltipRow
                                    label={'Redeem'}
                                    color={this.props.theme.colors.redeem}
                                    value={redeemFormatted}
                                />
                            </CustomTooltip>
                        );
                    }
                };
                break;
            case'AUM_TRANCHE':

                maxChartValue = 0;
                console.log("Here In Aum")
                chartData.push({
                    id:'AUM_AA',
                    color: tranchesConfig.AA.color.hex,
                    data: apiResults_aa.map((d,i) => {

                        const aum = this.functionsUtil.fixTokenDecimals(d.contractValue,18);
                        const x = moment(d.timeStamp*1000).format("YYYY/MM/DD HH:mm");
                        const y = parseFloat(aum.toString());

                        maxChartValue = Math.max(maxChartValue,y);

                        return { x,y };
                    })
                });
                chartData.push({
                    id:'AUM_BB',
                    color: tranchesConfig.BB.color.hex,
                    data: apiResults_bb.map((d,i) => {

                        const aum = this.functionsUtil.fixTokenDecimals(d.contractValue,18);
                        const x = moment(d.timeStamp*1000).format("YYYY/MM/DD HH:mm");
                        const y = parseFloat(aum.toString());

                        maxChartValue = Math.max(maxChartValue,y);

                        return { x,y };
                    })
                });
                console.log("Aum",chartData)

                // Add allocation

                // Set chart type
                chartType = Line;

                gridYStep = parseFloat(maxChartValue/maxGridLines);
                gridYValues = [0];
                for (let i=1;i<=5;i++){
                    gridYValues.push(i*gridYStep);
                }

                axisBottomIndex = 0;
                axisBottomMaxValues = 6;
                daysCount = moment(chartData[0].data[chartData[0].data.length-1].x,"YYYY/MM/DD HH:mm").diff(moment(chartData[0].data[0].x,"YYYY/MM/DD HH:mm"),'days');
                daysFrequency = Math.max(1,Math.ceil(daysCount/axisBottomMaxValues));

                chartProps = {
                    xScale:{
                        type: 'time',
                        format: '%Y/%m/%d %H:%M',
                        // precision: 'hour',
                    },
                    xFormat:'time:%b %d %H:%M',
                    yFormat:v => this.functionsUtil.formatMoney(v,v<1 ? 3 :0),
                    yScale:{
                        type: 'linear',
                        stacked: false
                    },
                    axisLeft:{
                        legend: '',
                        tickSize: 0,
                        orient: 'left',
                        tickPadding: 10,
                        tickRotation: 0,
                        legendOffset: -70,
                        tickValues:gridYValues,
                        legendPosition: 'middle',
                        format: v => this.functionsUtil.abbreviateNumber(v,v<1 ? 3 :0),
                    },
                    axisBottom: this.props.isMobile ? null : {
                        legend: '',
                        tickSize: 0,
                        format: (value) => {
                            if (axisBottomIndex++ % daysFrequency === 0){
                                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
                            }
                        },
                        tickPadding: 15,
                        orient: 'bottom',
                        legendOffset: 0,
                        tickValues: 'every day',
                        legendPosition: 'middle'
                    },
                    gridYValues,
                    pointSize:0,
                    useMesh:true,
                    animate:false,
                    pointLabel:"y",
                    curve:'linear',
                    enableArea:false,
                    enableSlices:'x',
                    enableGridX:false,
                    enableGridY:true,
                    pointBorderWidth:1,
                    colors:d => d.color,
                    pointLabelYOffset:-12,
                    legends:[
                        {
                            itemWidth: this.props.isMobile ? 70 : 80,
                            itemHeight: 18,
                            translateX: this.props.isMobile ? -35 : 0,
                            translateY: this.props.isMobile ? 40 : 65,
                            symbolSize: 10,
                            itemsSpacing: 5,
                            direction: 'row',
                            anchor: 'bottom-left',
                            symbolShape: 'circle',
                            itemTextColor: this.props.theme.colors.legend,
                            effects: [
                                {
                                    on: 'hover',
                                    style: {
                                        itemTextColor: this.props.themeMode === 'light' ? '#000' : '#fff'
                                    }
                                }
                            ]
                        }
                    ],
                    theme:{
                        axis: {
                            ticks: {
                                text: {
                                    fontSize: this.props.isMobile ? 12: 14,
                                    fontWeight:600,
                                    fill:this.props.theme.colors.legend,
                                    fontFamily: this.props.theme.fonts.sansSerif
                                }
                            }
                        },
                        grid: {
                            line: {
                                stroke: this.props.theme.colors.lineChartStroke, strokeDasharray: '10 6'
                            }
                        },
                        legends:{
                            text:{
                                fontSize: this.props.isMobile ? 12: 14,
                                fill:this.props.theme.colors.legend,
                                fontWeight:500,
                                fontFamily: this.props.theme.fonts.sansSerif
                            }
                        }
                    },
                    pointColor:{ from: 'color', modifiers: []},
                    margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 65 } : { top: 20, right: 40, bottom: 70, left: 70 },
                    sliceTooltip:(slideData) => {
                        const { slice } = slideData;
                        const point = slice.points[0];
                        if (typeof point === 'object' && typeof point.data === 'object'){
                            return (
                                <CustomTooltip
                                    point={point}
                                >
                                    <CustomTooltipRow
                                        label={point.serieId}
                                        color={point.serieColor}
                                        value={point.data.yFormatted}
                                    />
                                    {
                                        point.data.allocations && typeof point.data.allocations === 'object' &&
                                        Object.keys(point.data.allocations).map(protocolName => {
                                            const protocolInfo = globalConfigs.stats.protocols[protocolName];
                                            const protocolColor = 'hsl('+protocolInfo.color.hsl.join(',')+')';
                                            const protocolAllocation = point.data.allocations[protocolName];
                                            const protocolAllocationFormatted = this.functionsUtil.formatMoney(protocolAllocation,protocolAllocation<1 ? 3 : 0);
                                            const protocolAllocationPerc = this.functionsUtil.BNify(point.data.allocations[protocolName]).div(this.functionsUtil.BNify(point.data.y)).times(100).toFixed(0)+'%';
                                            return (
                                                <CustomTooltipRow
                                                    color={protocolColor}
                                                    label={protocolInfo.label}
                                                    key={`${point.id}_${protocolName}`}
                                                    value={`${protocolAllocationFormatted} (${protocolAllocationPerc})`}
                                                />
                                            );
                                        })
                                    }
                                </CustomTooltip>
                            );
                            /*
                            return (
                              <div
                                  key={point.id}
                                  style={{
                                    background: 'white',
                                    color: 'inherit',
                                    fontSize: 'inherit',
                                    borderRadius: '2px',
                                    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 1px 2px',
                                    padding: '5px 9px'
                                  }}
                              >
                                <div>
                                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                                    <tbody>
                                      <tr>
                                        <td style={{padding:'3px 5px'}}>
                                          <span style={{display:'block', width: '12px', height: '12px', background: point.serieColor}}></span>
                                        </td>
                                        <td style={{padding:'3px 5px'}}>{point.serieId}</td>
                                        <td style={{padding:'3px 5px'}}><strong>{point.data.yFormatted}</strong></td>
                                      </tr>
                                      {
                                        point.data.allocations && typeof point.data.allocations === 'object' &&
                                          Object.keys(point.data.allocations).map(protocolName => {
                                            const protocolColor = 'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')';
                                            const protocolAllocation = this.functionsUtil.formatMoney(point.data.allocations[protocolName],0);
                                            const protocolAllocationPerc = this.functionsUtil.BNify(point.data.allocations[protocolName]).div(this.functionsUtil.BNify(point.data.y)).times(100).toFixed(0)+'%';
                                            return (
                                              <tr key={`${point.id}_${protocolName}`}>
                                                <td style={{padding:'3px 5px'}}>
                                                  <span style={{display:'block', width: '12px', height: '12px', background: protocolColor}}></span>
                                                </td>
                                                <td style={{padding:'3px 5px',textTransform:'capitalize'}}>{protocolName}</td>
                                                <td style={{padding:'3px 5px'}}><strong>{protocolAllocation}</strong> ({protocolAllocationPerc})</td>
                                              </tr>
                                            );
                                          })
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                            */
                        }

                        return null;
                    }
                };
                break;
            default:
                break;
        }

        console.log(this.props.chartMode,chartProps,chartData);

        this.setState({
            chartType,
            chartProps,
            chartData
        });
    }

    render() {
        return(
            <GenericChart
                showLoader={true}
                {...this.state.chartProps}
                height={this.props.height}
                type={this.state.chartType}
                data={this.state.chartData}
                width={this.state.chartWidth}
                isMobile={this.props.isMobile}
                parentId={this.props.parentId}
                parentIdHeight={this.props.parentIdHeight}
            />
        );
    }
}

export default TrancheChart;