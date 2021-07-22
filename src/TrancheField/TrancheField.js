// import { Line } from '@nivo/line';
// import CountUp from 'react-countup';
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import CustomField from '../CustomField/CustomField';
// import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';
// import GenericChart from '../GenericChart/GenericChart';
// import CustomTooltip from '../CustomTooltip/CustomTooltip';
// import VariationNumber from '../VariationNumber/VariationNumber';
// import AllocationChart from '../AllocationChart/AllocationChart';
// import CustomTooltipRow from '../CustomTooltip/CustomTooltipRow';
import { Image, Text, Loader, Button, Tooltip, Icon, Flex } from "rimble-ui";

class TrancheField extends Component {

  state = {
    ready:false
  };

  // Utils
  functionsUtil = null;
  componentUnmounted = false;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillUnmount(){
    this.componentUnmounted = true;
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidMount(){
    this.loadField();
  }

  async setStateSafe(newState,callback=null) {
    if (!this.componentUnmounted){
      return this.setState(newState,callback);
    }
    return null;
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const mobileChanged = prevProps.isMobile !== this.props.isMobile;
    const protocolChanged = prevProps.protocol !== this.props.protocol;
    const themeModeChanged = prevProps.themeMode !== this.props.themeMode;
    const fieldChanged = prevProps.fieldInfo.name !== this.props.fieldInfo.name;
    const contractInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized && this.props.contractsInitialized;
    const transactionsChanged = prevProps.transactions && this.props.transactions && Object.values(prevProps.transactions).filter(tx => (tx.status==='success')).length !== Object.values(this.props.transactions).filter(tx => (tx.status==='success')).length;

    if (fieldChanged || protocolChanged || accountChanged || transactionsChanged || (contractInitialized && !this.state.ready)){
      this.setStateSafe({
        ready:false
      },() => {
        this.loadField();
      });
    } else if (mobileChanged || themeModeChanged){
      const oldState = Object.assign({},this.state);
      this.setStateSafe({
        ready:false
      },() => {
        this.setState(oldState);
      });
    }
  }

  loadField = async(fieldName=null) => {

    if (this.componentUnmounted || !this.props.protocol || !this.props.tokenConfig){
      return false;
    }

    const setState = fieldName === null;
    const fieldInfo = this.props.fieldInfo;
    if (!fieldName){
      fieldName = fieldInfo.name;
    }

    const fieldProps = fieldInfo.props;
    const decimals = fieldProps && fieldProps.decimals ? fieldProps.decimals : ( this.props.isMobile ? 2 : 3 );
    // const addCurveApy = typeof this.props.addCurveApy !== 'undefined' ? this.props.addCurveApy : false;
    const addGovTokens = typeof this.props.addGovTokens !== 'undefined' ? this.props.addGovTokens : true;

    let output = null;
    if (this.props.token){
      switch (fieldName){
        default:
          output = await this.functionsUtil.loadTrancheField(fieldName,fieldProps,this.props.protocol,this.props.token,this.props.tranche,this.props.tokenConfig,this.props.trancheConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              ready:true,
              [fieldName]:output
            });
          }
        break;
      }
    }

    return output;
  }

  render(){
    const fieldInfo = this.props.fieldInfo;
    let output = null;

    const showLoader = fieldInfo.showLoader === undefined || fieldInfo.showLoader;
    const loader = showLoader ? (<Loader size="20px" />) : null;

    const fieldProps = {
      fontWeight:3,
      fontSize:[0,2],
      color:'cellText',
      flexProps:{
        justifyContent:'flex-start'
      }
    };

    // Replace props
    if (fieldInfo.props && Object.keys(fieldInfo.props).length){
      Object.keys(fieldInfo.props).forEach(p => {
        fieldProps[p] = fieldInfo.props[p];
      });
    }

    // Merge with funcProps
    if (fieldInfo.funcProps && Object.keys(fieldInfo.funcProps).length){
      Object.keys(fieldInfo.funcProps).forEach(p => {
        if (typeof fieldInfo.funcProps[p]==='function'){
          fieldProps[p] = fieldInfo.funcProps[p](this.props);
        }
      });
    }

    const tokenConfig = this.props.tokenConfig;// || this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.token]);
      
    const maxPrecision = fieldProps && fieldProps.maxPrecision ? fieldProps.maxPrecision : 5;
    const decimals = fieldProps && fieldProps.decimals ? fieldProps.decimals : ( this.props.isMobile ? 2 : 3 );
    const minPrecision = fieldProps && fieldProps.minPrecision ? fieldProps.minPrecision : ( this.props.isMobile ? 3 : 4 );

    switch (fieldInfo.name){
      case 'protocolIcon':
        output = (
          <Image src={`images/protocols/${this.props.protocol}.svg`} {...fieldProps} />
        );
      break;
      case 'tokenIcon':
        output = (
          <Image src={`images/tokens/${this.props.token}.svg`} {...fieldProps} />
        );
      break;
      case 'button':
        const buttonLabel = typeof fieldInfo.label === 'function' ? fieldInfo.label(this.props) : fieldInfo.label;
        output = (
          <Button {...fieldProps} onClick={() => fieldProps.handleClick(this.props) }>{buttonLabel}</Button>
        );
      break;
      case 'custom':
        output = (
          <CustomField
            row={this.props}
            fieldInfo={fieldInfo}
          />
        );
      break;
      case 'govTokens':
      case 'autoFarming':
      case 'stakingRewards':
        output = this.state[fieldInfo.name] && Object.keys(this.state[fieldInfo.name]).length>0 ? (
          <Flex
            width={1}
            alignItems={'center'}
            flexDirection={'row'}
            justifyContent={'flex-start'}
            {...fieldInfo.parentProps}
          >
            {
              Object.values(this.state[fieldInfo.name]).map( (govTokenConfig,govTokenIndex) => (
                <AssetField
                  token={govTokenConfig.token}
                  tokenConfig={govTokenConfig}
                  key={`asset_${govTokenIndex}`}
                  fieldInfo={{
                    name:'iconTooltip',
                    tooltipProps:{
                      message:`${govTokenConfig.token}`+(this.state.getGovTokensDistributionSpeed && this.state.getGovTokensDistributionSpeed[govTokenConfig.token] ? `: ${this.state.getGovTokensDistributionSpeed[govTokenConfig.token].toFixed(decimals)}/${govTokenConfig.distributionFrequency} (for the whole pool)` : '')
                    },
                    props:{
                      borderRadius:'50%',
                      position:'relative',
                      height:['1.4em','2em'],
                      ml:govTokenIndex ? '-10px' : 0,
                      zIndex:Object.values(this.state[fieldInfo.name]).length-govTokenIndex,
                      boxShadow:['1px 1px 1px 0px rgba(0,0,0,0.1)','1px 2px 3px 0px rgba(0,0,0,0.1)'],
                    }
                  }}
                />
              ))
            }
          </Flex>
        ) : this.state[fieldInfo.name] ? (
          <Text {...fieldProps}>-</Text>
        ) : loader
      break;
      default:
        let formattedValue = this.state[fieldInfo.name];
        if (this.state[fieldInfo.name] && this.state[fieldInfo.name]._isBigNumber){
          formattedValue = this.state[fieldInfo.name].toFixed(decimals);
        }
        output = this.state[fieldInfo.name] ? (
          <Text {...fieldProps}>{formattedValue}</Text>
        ) : loader
      break;
    }
    return output;
  }
}

export default TrancheField;
