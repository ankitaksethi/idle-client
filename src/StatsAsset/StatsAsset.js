import moment from 'moment';
import StatsChart from '../Stats/StatsChart';
import React, { Component } from 'react';
import Rebalance from '../Rebalance/Rebalance';
import StatsCard from '../StatsCard/StatsCard';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import SmartNumber from '../SmartNumber/SmartNumber';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import AssetSelector from '../AssetSelector/AssetSelector';
import GenericSelector from '../GenericSelector/GenericSelector';
import RoundIconButton from '../RoundIconButton/RoundIconButton';
import VariationNumber from '../VariationNumber/VariationNumber';
import AllocationChart from '../AllocationChart/AllocationChart';
import DateRangeModal from '../utilities/components/DateRangeModal';
import { Flex, Text, Heading, Box, Icon } from 'rimble-ui';
class StatsAsset extends Component {

    state = {
        aum:null,
        apr:null,
        days:'-',
        delta:null,
        earning:null,
        minDate:null,
        maxDate:null,
        carouselMax:1,
        rebalances:'-',
        buttonGroups:[],
        apiResults:null,
        carouselIndex:0,
        idleVersion:null,
        statsVersions:{},
        minStartTime:null,
        endTimestamp:null,
        govTokensPool:null,
        unlentBalance:null,
        quickSelection:null,
        startTimestamp:null,
        endTimestampObj:null,
        shouldRebalance:null,
        carouselOffsetLeft:0,
        startTimestampObj:null,
        apiResults_unfiltered:null,
        dateRangeModalOpened:false
      };
    
      quickSelections = {
        day:{
          value:1,
          type:'day',
          label:'Last day',
        },
        week:{
          value:1,
          type:'week',
          label:'Last week',
        },
        weeks:{
          value:2,
          type:'week',
          label:'Last 2 weeks',
        },
        month:{
          value:1,
          type:'month',
          label:'Last month',
        },
        ytd:{
          type:'day',
          label:'Year to date',
          value:moment().diff(moment('01/01/YYYY','DD/MM/YYYY'),'days'),
        },
      };
    
      // Utils
      functionsUtil = null;
      componentUnmounted = null;
      loadUtils(){
        if (this.functionsUtil){
          this.functionsUtil.setProps(this.props);
        } else {
          this.functionsUtil = new FunctionsUtil(this.props);
        }
      }
    
      async componentWillMount() {
        this.loadUtils();
        await this.loadParams();
      }
    
      componentWillUnmount(){
        this.componentUnmounted = true;
      }
    
      async setStateSafe(newState,callback=null) {
        if (!this.componentUnmounted){
          return this.setState(newState,callback);
        }
        return null;
      }
    
    
      getLatestAvailableVersion(){
        const statsVersions = globalConfigs.stats.versions;
        let latestVersion = null;
        Object.keys(statsVersions).forEach( version => {
          const versionInfo = statsVersions[version];
          if (versionInfo.enabledStrategies.includes(this.props.selectedStrategy)){
            latestVersion = version;
          }
        });
    
        return latestVersion;
      }
    
      getVersionInfo(version){
        if (!version){
          version = this.state.idleVersion;
        }
    
        if (!globalConfigs.stats.versions[version]){
          return null;
        }
    
        const versionInfo = Object.assign({},globalConfigs.stats.versions[version]);
    
        if (versionInfo.strategiesParams && versionInfo.strategiesParams[this.props.selectedStrategy]){
          const versionInfoExtra = versionInfo.strategiesParams[this.props.selectedStrategy];
          Object.keys(versionInfoExtra).forEach( param => {
            versionInfo[param] = versionInfoExtra[param];
          });
        }
    
        return versionInfo;
      }
    
      async loadParams() {
    
        if (!this.props.selectedToken || !this.props.tokenConfig){
          return false;
        }
    
        const newState = {};
        const { match: { params } } = this.props;
    
        const currentNetworkAvailableTokens = Object.keys(this.props.availableTokens);
    
        if (!!params.customToken && currentNetworkAvailableTokens.indexOf(params.customToken.toUpperCase()) !== -1 ){
          newState.selectedToken = params.customToken.toUpperCase();
        } else {
          newState.selectedToken = this.props.selectedToken.toUpperCase();
        }
    
        newState.tokenConfig = this.props.availableTokens[newState.selectedToken];
        newState.minStartTime = moment(globalConfigs.stats.tokens[this.props.selectedToken].startTimestamp,'YYYY-MM-DD');
        newState.maxEndDate = moment();
    
        newState.endTimestampObj = moment(moment().format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');
    
        newState.latestVersion = this.getLatestAvailableVersion();
        newState.idleVersion = this.state.idleVersion === null ? newState.latestVersion : this.state.idleVersion;
    
        const versionInfo = this.getVersionInfo(newState.idleVersion);
    
        // console.log('loadParams',newState.latestVersion,newState.idleVersion,versionInfo);
    
        if (newState.idleVersion && versionInfo.endTimestamp){
          const newEndTimestampObj = moment(moment(versionInfo.endTimestamp*1000).format('YYYY-MM-DD HH:mm'),'YYYY-MM-DD HH:mm');
          if (newState.endTimestampObj.isAfter(newEndTimestampObj)){
            newState.endTimestampObj = newEndTimestampObj;
            newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);
          }
    
          if (!newState.maxEndDate || newState.maxEndDate.isAfter(newEndTimestampObj)){
            newState.maxEndDate = newEndTimestampObj;
          }
        }
    
        newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);
    
        // Set start date
        newState.startTimestampObj = newState.endTimestampObj.clone().subtract(1,'month');
        newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);
    
        if (newState.idleVersion && versionInfo.startTimestamp){
          const newStartTimestampObj = moment(moment(versionInfo.startTimestamp*1000).format('YYYY-MM-DD HH:mm'),'YYYY-MM-DD HH:mm');
          if (newState.startTimestampObj.isBefore(newStartTimestampObj)){
            newState.startTimestampObj = newStartTimestampObj;
            newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);
          }
    
          if (newState.minStartTime.isBefore(newStartTimestampObj)){
            newState.minStartTime = newStartTimestampObj;
          }
        }
    
        newState.minDate = newState.minStartTime._d;
        newState.maxDate = newState.maxEndDate._d;
    
        if (newState !== this.state){
          await this.setStateSafe(newState);
        }
      }
    
      setDateRange = (ranges,quickSelection=null) => {
    
        const minStartTime = moment(globalConfigs.stats.tokens[this.props.selectedToken].startTimestamp);
    
        let startTimestampObj = moment(ranges.startDate).isSameOrAfter(minStartTime) ? moment(ranges.startDate) : minStartTime;
        let endTimestampObj = moment(ranges.endDate);
    
        if (startTimestampObj.isSame(endTimestampObj)){
          endTimestampObj.add(1,'day');
        }
    
        endTimestampObj = moment(endTimestampObj.format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');
    
        if (startTimestampObj.isBefore(this.state.minStartTime)){
          startTimestampObj = this.state.minStartTime;
        }
    
        if (endTimestampObj.isAfter(this.state.maxEndDate)){
          endTimestampObj = this.state.maxEndDate;
        }
    
        const startTimestamp = parseInt(startTimestampObj._d.getTime()/1000);
        const endTimestamp = parseInt(endTimestampObj._d.getTime()/1000);
    
        const newState = {
          minStartTime,
          endTimestamp,
          quickSelection,
          startTimestamp,
          endTimestampObj,
          startTimestampObj
        };
    
        this.setStateSafe(newState);
    
        return newState;
      }
      
      setDateRangeModal = (dateRangeModalOpened) => {
        if (dateRangeModalOpened !== this.state.dateRangeModalOpened){
          this.setStateSafe({
            dateRangeModalOpened
          });
        }
      }
    
      async componentDidMount() {
    
        if (!this.props.web3){
          this.props.initWeb3();
          return false;
        }
    
        /*
        const style = document.createElement('style');
        style.id = 'crisp-custom-style';
        style.type = 'text/css';
        style.innerHTML = `
        .crisp-client{
          display:none !important;
        }`;
        document.body.appendChild(style);
        */
    
        this.loadUtils();
        await this.loadParams();
        this.loadApiData();
        this.loadCarousel();
      }
    
      loadCarousel(){
        const carouselMax = this.props.isMobile ? 3 : 2;
        this.setStateSafe({
          carouselMax
        });
      }
    
      async componentDidUpdate(prevProps,prevState) {
        const contractsInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized;
        const strategyChanged = prevProps.selectedStrategy !== this.props.selectedStrategy;
        const tokenChanged = prevProps.selectedToken !== this.props.selectedToken || JSON.stringify(prevProps.tokenConfig) !== JSON.stringify(this.props.tokenConfig);
        const dateChanged = prevState.startTimestamp !== this.state.startTimestamp || prevState.endTimestamp !== this.state.endTimestamp;
        const versionChanged = prevState.idleVersion !== this.state.idleVersion;
        const mobileChanged = prevProps.isMobile !== this.props.isMobile;
    
        if (mobileChanged){
          this.loadCarousel();
        }
    
        if (contractsInitialized || tokenChanged || strategyChanged || versionChanged){
          // console.log('componentDidUpdate',this.props.selectedStrategy,this.props.selectedToken);
          await this.componentDidMount();
        } else if (dateChanged){
          this.loadApiData();
        }
      }
    
      filterTokenData = (apiResults) => {
        return apiResults.filter((r,i) => {
          return (!this.state.startTimestamp || r.timestamp >= this.state.startTimestamp) && (!this.state.endTimestamp || r.timestamp <= this.state.endTimestamp);
        });
      }
    
      setIdleVersion = idleVersion => {
        this.setStateSafe({
          idleVersion
        });
      }
    
      loadApiData = async () => {
    
        if (!this.props.selectedToken || !this.props.tokenConfig){
          return false;
        }
    
        // Get COMP APR
        // const compAPR = await this.functionsUtil.getCompAPR(this.props.tokenConfig);
        // console.log('compAPR',compAPR.toString());
    
        const startTimestamp = this.state.minDate ? parseInt(this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(this.state.minDate).format('DD/MM/YYYY 00:00:00'),'DD/MM/YYYY HH:mm:ss')._d.getTime()/1000) : null;
        const endTimestamp = this.state.maxDate ? parseInt(this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(this.state.maxDate).format('DD/MM/YYYY 23:59:59'),'DD/MM/YYYY HH:mm:ss')._d.getTime()/1000) : null;
    
        const isRisk = ['v3','v4'].includes(this.state.idleVersion) && this.props.selectedStrategy === 'risk';
        let apiResults_unfiltered = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,isRisk,startTimestamp,endTimestamp,true,7200);
    
        const apiResults = this.filterTokenData(apiResults_unfiltered);
    
        // console.log('loadApiData',startTimestamp,endTimestamp,new Date(startTimestamp*1000),new Date(endTimestamp*1000),apiResults,apiResults_unfiltered);
    
        if (!apiResults || !apiResults_unfiltered || !apiResults.length || !apiResults_unfiltered.length){
          return false;
        }
    
        const firstResult = apiResults[0];
        const lastResult = Object.values(apiResults).pop();
    
        window.moment = moment;
    
        let days = (lastResult.timestamp-firstResult.timestamp)/86400;
        if (days === 0){
          days = 1;
        }
    
        let apr = null;
        let delta = 'N/A';
    
        const idleTokens = this.functionsUtil.fixTokenDecimals(lastResult.idleSupply,18);
        const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.props.tokenConfig.decimals);
        const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.props.tokenConfig.decimals);
    
        // Calculate AUM
        let aum = idleTokens.times(lastIdlePrice);
    
        // Convert Token balance
        aum = await this.functionsUtil.convertTokenBalance(aum,this.props.selectedToken,this.props.tokenConfig,isRisk);
    
        const compoundInfo = this.props.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
        const firstCompoundData = compoundInfo ? firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0] : null;
        const lastCompoundData = compoundInfo ? lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0] : null;
    
        if (this.state.idleVersion === 'v4') {
    
          apr = apiResults.reduce( (sum,r) => {
            const idleRate = this.functionsUtil.fixTokenDecimals(r.idleRate,18);
            return this.functionsUtil.BNify(sum).plus(idleRate);
          },0);
    
          // Calculate average
          apr = apr.div(apiResults.length);
    
          if (compoundInfo){
            const compoundWithCOMPInfo = globalConfigs.stats.protocols.compoundWithCOMP;
            const rateField = compoundWithCOMPInfo.rateField ? compoundWithCOMPInfo.rateField : 'rate';
    
            let compoundAvgApr = apiResults.reduce( (sum,r) => {
    
              const compoundData = r.protocolsData.find((pData,x) => {
                return pData.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase()
              });
    
              let compoundRate = typeof rateField === 'object' && rateField.length ? rateField.reduce((acc,field) => {
                if (compoundData && compoundData[field]){
                  return this.functionsUtil.BNify(acc).plus(this.functionsUtil.BNify(compoundData[field]));
                }
                return this.functionsUtil.BNify(acc);
              },0) : this.functionsUtil.BNify(compoundData[rateField]);
    
              compoundRate = this.functionsUtil.fixTokenDecimals(compoundRate,18);
    
              return this.functionsUtil.BNify(sum).plus(compoundRate);
            },0);
    
            // Calculate average
            compoundAvgApr = compoundAvgApr.div(apiResults.length);
    
            // compoundAvgApr = this.functionsUtil.apr2apy(compoundAvgApr.div(100)).times(100);
            // apr = this.functionsUtil.apr2apy(apr.div(100)).times(100);
    
            delta = apr.minus(compoundAvgApr);
            if (parseFloat(delta)<0){
              delta = 0
            }
            delta = delta.toFixed(2);
          }
    
          apr = apr.toFixed(2);
    
        } else {
          const earning = lastIdlePrice.div(firstIdlePrice).minus(1).times(100);
          apr = earning.times(365).div(days).toFixed(2);
    
          if (firstCompoundData && lastCompoundData){
            const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.props.tokenConfig.decimals);
            const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.props.tokenConfig.decimals);
            const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100);
            delta = earning.minus(compoundApr).times(365).div(days);
            if (parseFloat(delta)<0){
              delta = 0
            }
            delta = delta.toFixed(2);
          }
        }
    
        // Count rebalances
        let rebalances = 0;
        apiResults.forEach((row,index) => {
          if (index){
            const prevRow = apiResults[index-1];
    
            const totalAllocation = row.protocolsData.reduce((accumulator,protocolAllocation) => {
              const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
              return this.functionsUtil.BNify(accumulator).plus(allocation);
            },0);
    
            const prevTotalAllocation = prevRow.protocolsData.reduce((accumulator,protocolAllocation) => {
              const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
              return this.functionsUtil.BNify(accumulator).plus(allocation);
            },0);
    
            let hasRebalanced = false;
            row.protocolsData.forEach( p => {
              if (hasRebalanced){
                return;
              }
              const prevP = prevRow.protocolsData.find( prevP => (prevP.protocolAddr.toLowerCase() === p.protocolAddr.toLowerCase()) );
              const allocation = this.functionsUtil.fixTokenDecimals(p.allocation,this.props.tokenConfig.decimals);
              const prevAllocation = prevP ? this.functionsUtil.fixTokenDecimals(prevP.allocation,this.props.tokenConfig.decimals) : this.functionsUtil.BNify(0);
              const allocationPerc = parseInt(parseFloat(allocation.div(totalAllocation).times(100)));
              const prevAllocationPerc = parseInt(parseFloat(prevAllocation.div(prevTotalAllocation).times(100)));
              if (allocationPerc!==prevAllocationPerc){
                rebalances++;
                hasRebalanced = true;
              }
            });
          }
        });
    
        // Add gov tokens balance to AUM
        const availableTokens = {};
        availableTokens[this.props.selectedToken] = this.props.tokenConfig;
        const govTokensPool = await this.functionsUtil.getGovTokenPool(null,availableTokens,'DAI');
        if (govTokensPool){
          aum = aum.plus(govTokensPool);
        }
    
        let unlentBalance = await this.functionsUtil.getUnlentBalance(this.props.tokenConfig);
        if (unlentBalance){
          unlentBalance = this.functionsUtil.formatMoney(parseFloat(unlentBalance));
        }
    
        this.setStateSafe({
          aum,
          apr,
          days,
          delta,
          apiResults,
          rebalances,
          govTokensPool,
          unlentBalance,
          apiResults_unfiltered
        });
      }
    
      selectToken = async (strategy,token) => {
        await this.props.setStrategyToken(strategy,token);
        this.props.changeToken(token);
      }
    
      handleCarousel = action => {
        let carouselIndex = this.state.carouselIndex;
        if (action==='next' && carouselIndex<this.state.carouselMax){
          carouselIndex++;
        } else if (action==='back' && carouselIndex>0){
          carouselIndex--;
        }
    
        const $element = window.jQuery(`#carousel-cursor > div:eq(${carouselIndex})`);
        const carouselOffsetLeft = -parseFloat($element.position().left)+'px';
    
        this.setStateSafe({
          carouselIndex,
          carouselOffsetLeft
        });
      }
    

    render() {
      const networkId = this.functionsUtil.getRequiredNetworkId();
      const idleTokenAvailableNetworks = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','availableNetworks']);
      const idleTokenEnabled = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','enabled']) && idleTokenAvailableNetworks.includes(networkId);
      
      const refreshIdleSpeedConfig = this.functionsUtil.getGlobalConfig(['contract','methods','refreshIdleSpeed']);
      const refreshIdleSpeedEnabled = refreshIdleSpeedConfig.enabled && refreshIdleSpeedConfig.availableNetworks.includes(networkId);

      const apyLong = this.functionsUtil.getGlobalConfig(['messages','apyLong']);
    
      const statsTokens = this.functionsUtil.getGlobalConfig(['stats','tokens']);
      const valueProps = {
          lineHeight:1,
          fontSize:[4,5],
          fontWeight:[3,4],
          color:'statValue'
        };
    
        const unitProps = {
          ml:2,
          lineHeight:1,
          fontWeight:[2,3],
          color:'statValue',
          fontSize:[3,'23px'],
        };
        const tokenConfig = statsTokens[this.props.selectedToken];
        const versionsOptions = Object.keys(globalConfigs.stats.versions).filter( version => {
            const versionInfo = this.getVersionInfo(version);
            return versionInfo.enabledTokens.includes(this.props.selectedToken) && versionInfo.enabledStrategies.includes(this.props.selectedStrategy);
        }).map( version => {
            const versionInfo = this.getVersionInfo(version);
            return {
            value:version,
            label:versionInfo.label
            }
        });
    
        // const disabledCharts = tokenConfig.disabledCharts || [];
    
        const versionInfo = this.getVersionInfo(this.state.idleVersion);
    
        let performanceTooltip = null;
        if (this.state.idleVersion && versionInfo){
            const showPerformanceTooltip = this.functionsUtil.getGlobalConfig(['stats','versions',this.state.idleVersion,'showPerformanceTooltip']);
            performanceTooltip = showPerformanceTooltip ? this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'performanceTooltip']) : null;
        }
    
        const versionDefaultValue = versionsOptions.find( v => (v.value === this.state.idleVersion) );
    
        return (
            <Flex
            p={0}
            width={1}
            flexDirection={'column'}
            >
            {
            /*
            }
            <Flex position={['absolute','relative']} left={0} px={[3,0]} zIndex={10} width={1} flexDirection={'row'} mb={[0,3]}>
                <Flex alignItems={'center'} width={[2/3,1/2]}>
                <RouterLink to="/">
                    <Image src="images/logo-gradient.svg"
                    height={['35px','48px']}
                    position={'relative'} />
                </RouterLink>
                <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={3} lineHeight={'initial'} fontSize={[4,5]} ml={[1,2]}>
                    <Text.span fontSize={'80%'}>|</Text.span> Stats
                </Heading.h3>
                </Flex>
                <Flex flexDirection={'row'} width={[1/3,1/2]} justifyContent={'flex-end'} alignItems={'center'}>
                {
                    this.state.buttonGroups && 
                    this.props.isMobile ? (
                        <ButtonGroup
                        isMobile={this.props.isMobile}
                        components={ this.state.buttonGroups.reduce((components,array) => components.concat(array),[]) }
                        theme={'light'}
                        />
                    ) :
                    this.state.buttonGroups.map((buttonGroup,i) => (
                        <ButtonGroup
                        key={`buttonGroup_${i}`}
                        isMobile={this.props.isMobile}
                        components={buttonGroup}
                        theme={'light'}
                        />
                    ))
                }
                </Flex>
            </Flex>
            */
            }
            <Box
                mb={[3,4]}
            >
                <Flex
                flexDirection={['column','row']}
                >
                <Flex
                    width={[1,0.4]}
                >
                  <Breadcrumb
                    {...this.props}
                    showPathMobile={true}
                    text={'ASSETS OVERVIEW'}
                    isMobile={this.props.isMobile}
                    handleClick={ e => this.props.goToSection('stats') }
                    path={[this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'title'])]}
                  />
                </Flex>
                <Flex
                    mt={[3,0]}
                    width={[1,0.6]}
                    flexDirection={['column','row']}
                    justifyContent={['center','space-between']}
                >
                    <Flex
                    width={[1,0.26]}
                    flexDirection={'column'}
                    >
                    <GenericSelector
                        innerProps={{
                        p:1,
                        height:['100%','46px'],
                        }}
                        name={'idle-version'}
                        options={versionsOptions}
                        defaultValue={versionDefaultValue}
                        onChange={ v => this.setIdleVersion(v) }
                    />
                    </Flex>
                    <Flex
                    mt={[3,0]}
                    width={[1,0.3]}
                    flexDirection={'column'}
                    >
                    <AssetSelector
                        innerProps={{
                        p:1
                        }}
                        {...this.props}
                    />
                    </Flex>
                    <Flex
                    mt={[3,0]}
                    width={[1,0.39]}
                    flexDirection={'column'}
                    >
                    <DashboardCard
                        cardProps={{
                        p:1,
                        display:'flex',
                        alignItems:'center',
                        height:['46px','100%'],
                        justifyContent:'center'
                        }}
                        isInteractive={true}
                        handleClick={ e => this.setDateRangeModal(true) }
                    >
                        <Text
                        fontWeight={3}
                        color={'copyColor'}
                        >
                        {
                        this.state.quickSelection
                        ?
                            this.quickSelections[this.state.quickSelection].label
                        : this.state.startTimestampObj && this.state.endTimestampObj &&
                            `${this.state.startTimestampObj.format('DD/MM/YY')} - ${this.state.endTimestampObj.format('DD/MM/YY')}`
                        }
                        </Text>
                    </DashboardCard>
                    </Flex>
                </Flex>
                </Flex>
            </Box>
            {
                !tokenConfig.enabled ? (
                <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                >
                    <DashboardCard
                    cardProps={{
                        p:3,
                        width:[1,0.5],
                    }}
                    >
                    <Flex
                        alignItems={'center'}
                        flexDirection={'column'}
                    >
                        <Icon
                        size={'2.3em'}
                        color={'cellText'}
                        name={'DoNotDisturb'}
                        />
                        <Text
                        mt={2}
                        fontSize={2}
                        color={'cellText'}
                        textAlign={'center'}
                        >
                        Stats for {this.props.selectedToken} are not available!
                        </Text>
                    </Flex>
                    </DashboardCard>
                </Flex>
                ) : this.state.idleVersion && this.functionsUtil.strToMoment(versionInfo.startTimestamp).isAfter(Date.now()) ? (
                <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                >
                    <DashboardCard
                    cardProps={{
                        p:3,
                        width:[1,0.5],
                    }}
                    >
                    <Flex
                        alignItems={'center'}
                        flexDirection={'column'}
                    >
                        <Icon
                        size={'2.3em'}
                        color={'cellText'}
                        name={'AccessTime'}
                        />
                        <Text
                        mt={2}
                        fontSize={2}
                        color={'cellText'}
                        textAlign={'center'}
                        >
                        Idle Stats {this.state.idleVersion} will be available shortly!
                        </Text>
                    </Flex>
                    </DashboardCard>
                </Flex>
                ) : this.functionsUtil.strToMoment(tokenConfig.startTimestamp).isAfter(Date.now()) ? (
                <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                >
                    <DashboardCard
                    cardProps={{
                        p:3,
                        width:[1,0.5],
                    }}
                    >
                    <Flex
                        alignItems={'center'}
                        flexDirection={'column'}
                    >
                        <Icon
                        size={'2.3em'}
                        color={'cellText'}
                        name={'AccessTime'}
                        />
                        <Text
                        mt={2}
                        fontSize={2}
                        color={'cellText'}
                        textAlign={'center'}
                        >
                        Stats for {this.props.selectedToken} will be available shortly!
                        </Text>
                    </Flex>
                    </DashboardCard>
                </Flex>
                ) : (
                <Box
                    width={1}
                >
                    <Box
                    mt={[3,0]}
                    mb={[3,4]}
                    >
                    <Flex
                        width={1}
                        alignItems={'center'}
                        justifyContent={'center'}
                        flexDirection={['column','row']}
                    >
                        <Flex
                        mb={[2,0]}
                        pr={[0,2]}
                        width={[1,1/4]}
                        flexDirection={'column'}
                        >
                        <StatsCard
                            title={'Asset Under Management'}
                            label={ this.state.unlentBalance ? `Unlent funds: ${this.state.unlentBalance} ${this.props.selectedToken}` : this.props.selectedToken }
                            labelTooltip={ this.state.unlentBalance ? this.functionsUtil.getGlobalConfig(['messages','cheapRedeem']) : null}
                        >
                            <SmartNumber
                            precision={2}
                            type={'money'}
                            {...valueProps}
                            unitProps={unitProps}
                            number={this.state.aum}
                            flexProps={{
                                alignItems:'baseline',
                                justifyContent:'flex-start'
                            }}
                            unit={this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'conversionRateField']) ? '$' : null}
                            />
                        </StatsCard>
                        </Flex>
                        <Flex
                        mb={[2,0]}
                        pr={[0,2]}
                        width={[1,1/4]}
                        flexDirection={'column'}
                        >
                        <StatsCard
                            title={'Avg APY'}
                            label={'Annualized'}
                        >
                            <Flex
                            width={1}
                            alignItems={'center'}
                            flexDirection={['column','row']}
                            >
                            <VariationNumber
                                direction={'up'}
                                iconPos={'right'}
                                iconSize={'1.8em'}
                                justifyContent={'flex-start'}
                                width={1}
                                >
                                <Text
                                lineHeight={1}
                                fontWeight={[3,4]}
                                color={'statValue'}
                                fontSize={[4,5]}
                                >
                                {this.state.apr}
                                <Text.span color={'statValue'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                                </Text>
                            </VariationNumber>
                            </Flex>
                        </StatsCard>
                        </Flex>
                        <Flex
                        mb={[2,0]}
                        pr={[0,2]}
                        width={[1,1/4]}
                        flexDirection={'column'}
                        >
                        <StatsCard
                            title={'Overperformance on Compound'}
                            label={'Annualized'}
                        >
                            {
                            this.state.delta && !isNaN(this.state.delta) ? (
                                <VariationNumber
                                direction={'up'}
                                iconPos={'right'}
                                iconSize={'1.8em'}
                                justifyContent={'flex-start'}
                                >
                                <Text
                                    lineHeight={1}
                                    fontSize={[4,5]}
                                    fontWeight={[3,4]}
                                    color={'statValue'}
                                >
                                    {this.state.delta}
                                    <Text.span color={'statValue'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                                </Text>
                                </VariationNumber>
                            ) : (
                                <Text
                                lineHeight={1}
                                fontSize={[4,5]}
                                fontWeight={[3,4]}
                                color={'statValue'}
                                >
                                {this.state.delta}
                                </Text>
                            )
                            }
                        </StatsCard>
                        </Flex>
                        <Flex
                        mb={[2,0]}
                        pr={[0,2]}
                        width={[1,1/4]}
                        flexDirection={'column'}
                        >
                        <StatsCard
                            label={' '}
                            title={'Rebalances'}
                            value={this.state.rebalances.toString()}
                        />
                        </Flex>
                        {
                        /*
                        <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
                        <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
                            <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                            <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Current APR</Text.span>
                            <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                                {this.state.currApr}
                                <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                            </Text>
                            </Flex>
                        </Card>
                        </Flex>
                        <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
                        <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
                            <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                            <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Days Live</Text.span>
                            <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                                {this.state.days}
                            </Text>
                            </Flex>
                        </Card>
                        </Flex>
                        */
                        }
                    </Flex>
                    </Box>
    
                    <DashboardCard
                    title={'Historical Performance'}
                    description={performanceTooltip}
                    cardProps={{
                        mb:[3,4]
                    }}
                    >
                    <Flex id='chart-PRICE' width={1} mb={3}>
                        <StatsChart
                        height={ 350 }
                        {...this.state}
                        parentId={'chart-PRICE'}
                        theme={this.props.theme}
                        isMobile={this.props.isMobile}
                        contracts={this.props.contracts}
                        themeMode={this.props.themeMode}
                        apiResults={this.state.apiResults}
                        idleVersion={this.state.idleVersion}
                        selectedToken={this.props.selectedToken}
                        apiResults_unfiltered={this.state.apiResults_unfiltered}
                        chartMode={this.state.idleVersion === this.state.latestVersion ? 'PRICE_V4' : 'PRICE'}
                        />
                    </Flex>
                    </DashboardCard>
    
                    <DashboardCard
                    cardProps={{
                        pb:3,
                        mb:[3,4]
                    }}
                    >
                    <Flex
                        flexDirection={['column','row']}
                        justifyContent={'space-between'}
                    >
                        {
                        this.state.idleVersion === this.state.latestVersion && 
                        <Flex
                            pt={2}
                            width={[1,1/3]}
                            id={'allocation-chart'}
                            flexDirection={'column'}
                            alignItems={'flex-start'}
                            justifyContent={'flex-start'}
                        >
                            <AllocationChart
                            height={310}
                            {...this.props}
                            parentId={'allocation-chart'}
                            />
                            <Rebalance
                            {...this.props}
                            />
                        </Flex>
                        }
                        <Flex
                        mb={[0,3]}
                        id={'chart-ALL'}
                        pl={[0,this.state.idleVersion === this.state.latestVersion ? 0 : 3]}
                        width={[1, this.state.idleVersion === this.state.latestVersion ? 2/3 : 1]}
                        >
                        <Flex alignItems={'flex-start'} justifyContent={'flex-start'} flexDirection={'column'} width={1}>
                            <Heading.h4
                            mb={2}
                            ml={3}
                            mt={[3,4]}
                            fontWeight={4}
                            fontSize={[2,3]}
                            textAlign={'left'}
                            color={'dark-gray'}
                            lineHeight={'initial'}
                            >
                            Allocations over time
                            </Heading.h4>
                            <StatsChart
                            height={350}
                            {...this.state}
                            chartMode={'ALL'}
                            parentId={'chart-ALL'}
                            theme={this.props.theme}
                            isMobile={this.props.isMobile}
                            themeMode={this.props.themeMode}
                            contracts={this.props.contracts}
                            apiResults={this.state.apiResults}
                            idleVersion={this.state.idleVersion}
                            apiResults_unfiltered={this.state.apiResults_unfiltered}
                            />
                        </Flex>
                        </Flex>
                    </Flex>
                    </DashboardCard>
    
                    <Flex
                    position={'relative'}
                    >
                    <Flex
                        width={1}
                        id={'carousel-container'}
                        justifyContent={'flex-end'}
                    >
                        <RoundIconButton
                        buttonProps={{
                            mr:3
                        }}
                        iconName={'ArrowBack'}
                        disabled={this.state.carouselIndex === 0}
                        handleClick={ e => this.handleCarousel('back') }
                        />
                        <RoundIconButton
                        iconName={'ArrowForward'}
                        handleClick={ e => this.handleCarousel('next') }
                        disabled={this.state.carouselIndex === this.state.carouselMax}
                        />
                    </Flex>
                    <Flex
                        mt={5}
                        height={'400px'}
                        position={'absolute'}
                        id={'carousel-cursor'}
                        width={['444%','200%']}
                        justifyContent={'flex-start'}
                        left={this.state.carouselOffsetLeft}
                        style={{
                        transition:'left 0.3s ease-in-out'
                        }}
                    >
                        <DashboardCard
                        cardProps={{
                            mr:4,
                            height:'fit-content',
                            style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                        }}
                        >
                        <Flex
                            width={1}
                            id='chart-AUM'
                        >
                            <Flex
                            mb={3}
                            width={1}
                            flexDirection={'column'}
                            alignItems={'flex-start'}
                            justifyContent={'center'}
                            >
                            <Heading.h4
                                ml={3}
                                mt={3}
                                mb={2}
                                fontWeight={4}
                                fontSize={[2,3]}
                                textAlign={'left'}
                                color={'dark-gray'}
                                lineHeight={'initial'}
                            >
                                Asset Under Management
                            </Heading.h4>
                            <StatsChart
                                height={300}
                                {...this.state}
                                chartMode={'AUM'}
                                parentId={'chart-AUM'}
                                theme={this.props.theme}
                                isMobile={this.props.isMobile}
                                themeMode={this.props.themeMode}
                                contracts={this.props.contracts}
                                apiResults={this.state.apiResults}
                                idleVersion={this.state.idleVersion}
                                apiResults_unfiltered={this.state.apiResults_unfiltered}
                            />
                            </Flex>
                        </Flex>
                        </DashboardCard>
                        <DashboardCard
                        cardProps={{
                            mr:4,
                            height:'fit-content',
                            style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                        }}
                        >
                        <Flex id='chart-APR' width={1}>
                            <Flex
                            mb={3}
                            width={1}
                            flexDirection={'column'}
                            alignItems={'flex-start'}
                            justifyContent={'center'}
                            >
                            <Heading.h4
                                mb={2}
                                ml={3}
                                mt={3}
                                fontWeight={4}
                                fontSize={[2,3]}
                                textAlign={'left'}
                                color={'dark-gray'}
                                lineHeight={'initial'}
                            >
                                APRs
                            </Heading.h4>
                            <StatsChart
                                height={300}
                                {...this.state}
                                chartMode={'APR'}
                                parentId={'chart-APR'}
                                theme={this.props.theme}
                                isMobile={this.props.isMobile}
                                themeMode={this.props.themeMode}
                                contracts={this.props.contracts}
                                apiResults={this.state.apiResults}
                                idleVersion={this.state.idleVersion}
                                apiResults_unfiltered={this.state.apiResults_unfiltered}
                            />
                            </Flex>
                        </Flex>
                        </DashboardCard>
                        {
                        /*
                        !disabledCharts.includes('score') &&
                            <DashboardCard
                            cardProps={{
                                mr:4,
                                height:'fit-content',
                                style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                            }}
                            title={'Risk Score'}
                            description={'Idle Risk Score is a weighted average of the underlying protocols risks assessed by DeFi Score'}
                            titleParentProps={{
                                ml:16,
                                mt:16
                            }}
                            >
                            <Flex id='chart-SCORE' width={1}>
                                <Flex
                                mb={3}
                                width={1}
                                flexDirection={'column'}
                                alignItems={'flex-start'}
                                justifyContent={'center'}
                                >
                                <StatsChart
                                    height={300}
                                    {...this.state}
                                    chartMode={'SCORE'}
                                    parentId={'chart-SCORE'}
                                    theme={this.props.theme}
                                    isMobile={this.props.isMobile}
                                    themeMode={this.props.themeMode}
                                    contracts={this.props.contracts}
                                    apiResults={this.state.apiResults}
                                    idleVersion={this.state.idleVersion}
                                    apiResults_unfiltered={this.state.apiResults_unfiltered}
                                />
                                </Flex>
                            </Flex>
                            </DashboardCard>
                            */
                        }
                        <DashboardCard
                        cardProps={{
                            mr:4,
                            height:'fit-content',
                            style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                        }}
                        >
                        <Flex id='chart-VOL' width={1}>
                            <Flex
                            mb={3}
                            width={1}
                            flexDirection={'column'}
                            alignItems={'flex-start'}
                            justifyContent={'center'}
                            >
                            <Heading.h4
                                mb={2}
                                ml={3}
                                mt={3}
                                fontWeight={4}
                                fontSize={[2,3]}
                                textAlign={'left'}
                                color={'dark-gray'}
                                lineHeight={'initial'}
                            >
                                Volume
                            </Heading.h4>
                            <StatsChart
                                height={300}
                                {...this.state}
                                chartMode={'VOL'}
                                parentId={'chart-VOL'}
                                theme={this.props.theme}
                                isMobile={this.props.isMobile}
                                themeMode={this.props.themeMode}
                                contracts={this.props.contracts}
                                apiResults={this.state.apiResults}
                                idleVersion={this.state.idleVersion}
                                apiResults_unfiltered={this.state.apiResults_unfiltered}
                            />
                            </Flex>
                        </Flex>
                        </DashboardCard>
                    </Flex>
                    </Flex>
                </Box>
                )
            }
            <DateRangeModal
                {...this.props}
                minDate={this.state.minDate}
                maxDate={this.state.maxDate}
                handleSelect={this.setDateRange}
                quickSelections={this.quickSelections}
                isOpen={this.state.dateRangeModalOpened}
                closeModal={e => this.setDateRangeModal(false)}
                startDate={this.state.startTimestampObj ? this.state.startTimestampObj._d : null}
                endDate={this.state.endTimestampObj ? this.state.endTimestampObj._d : null}
            />
            </Flex>
        );
        }
    
}
export default StatsAsset