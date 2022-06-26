import {html, css, LitElement} from 'lit';
import { create, cssomSheet } from 'twind'
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {repeat} from 'lit/directives/repeat.js';
// 1. Create separate CSSStyleSheet
const sheet = cssomSheet({ target: new CSSStyleSheet() })

const { tw } = create({ sheet })

class Web3Element extends LitElement {
  static styles = [sheet.target,
                  css`
                    .load{
                      width: 100%;
                      height: 100%;
                      text-align: center;
                      padding-top: 50px;
                      padding-bottom: 50px;
                    }
                    
                    .lds-dual-ring {
                        display: inline-block;
                        width: 80px;
                        height: 80px;
                      }
                    .lds-dual-ring:after {
                        content: " ";
                        display: block;
                        width: 64px;
                        height: 64px;
                        margin: 8px;
                        border-radius: 50%;
                        border: 6px solid #494949;
                        border-color: #494949 transparent #494949 transparent;
                        animation: lds-dual-ring 1.2s linear infinite;
                    }
                    @keyframes lds-dual-ring {
                        0% {
                          transform: rotate(0deg);
                        }
                        100% {
                          transform: rotate(360deg);
                        }
                    }
                    /* Success & Failed */
                    .demo-1-web3 {
                      width: 100%;
                      height: 100%;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      padding-top: 50px;
                      padding-bottom: 50px;
                    }
                    .ui-success,.ui-error {
                      width: 100px; height: 100px;
                      /*margin: 40px;*/
                      /*border:1px solid #eee;*/
                    }
                    
                    .ui-success{
                      &-circle {
                        stroke-dasharray: 260.75219024795285px, 260.75219024795285px;
                        stroke-dashoffset: 260.75219024795285px;
                        transform: rotate(220deg);
                        transform-origin: center center;
                        stroke-linecap: round;
                        animation: ani-success-circle 1s ease-in both;
                      }
                      &-path {
                        stroke-dasharray: 60px 64px;
                        stroke-dashoffset: 62px;
                        stroke-linecap: round;
                        animation: ani-success-path .4s 1s ease-in both;
                      }
                    }
                    
                    @keyframes ani-success-circle {
                      to{stroke-dashoffset: 782.2565707438586px;}
                    }
                    
                    @keyframes ani-success-path {
                      0% {stroke-dashoffset: 62px;}
                      65% {stroke-dashoffset: -5px;}
                      84%{stroke-dashoffset: 4px;}
                      100%{stroke-dashoffset: -2px;}
                    }
                    
                    .ui-error{
                      &-circle{
                        stroke-dasharray:260.75219024795285px, 260.75219024795285px;
                        stroke-dashoffset: 260.75219024795285px;
                        animation: ani-error-circle 1.2s linear;
                      }
                      &-line1{
                        stroke-dasharray: 54px 55px;
                        stroke-dashoffset: 55px;
                        stroke-linecap: round;
                        animation: ani-error-line .15s 1.2s linear both;
                      }
                      &-line2{
                        stroke-dasharray: 54px 55px;
                        stroke-dashoffset: 55px;
                        stroke-linecap: round;
                        animation: ani-error-line .2s .9s linear both;
                      }
                    }
                    
                    @keyframes ani-error-line{
                      to { stroke-dashoffset: 0; }
                    }
                    
                     @keyframes ani-error-circle {
                        0% {
                            stroke-dasharray: 0, 260.75219024795285px;
                            stroke-dashoffset: 0;
                        }
                        35% {
                            stroke-dasharray: 120px, 120px;
                            stroke-dashoffset: -120px;
                        }
                        70% {
                            stroke-dasharray: 0, 260.75219024795285px;
                            stroke-dashoffset: -260.75219024795285px;
                        }
                        100% {
                            stroke-dasharray: 260.75219024795285px, 0;
                            stroke-dashoffset: -260.75219024795285px;
                        }
                    }
                  `]

  static properties = {
    label : {type: String},
    receiver : {type: String},
    amount : {type: String},
    tokenNumber : {type: Number},
    token : {},

    signer : {},
    tx : {},

    modalConnect : {type: Boolean},
    modalPay : {type: Boolean},
    modalLoading : {type: Boolean},
    modalSuccess : {type: Boolean},
    modalFailed : {type: Boolean},
  };

  constructor() {
    super();
    
    this.label = this.getAttribute("label");
    this.receiver = this.getAttribute("receiver");
    this.amount = this.getAttribute("amount");
    this.tokenNumber = this.getAttribute("token-number");
    this.token = [];
    for (let index = 0; index < this.tokenNumber; index++) {
      this.token[index] = { 
        address: this.getAttribute("token"+index+"-address"), 
        symbol: this.getAttribute("token"+index+"-symbol"), 
        decimal: this.getAttribute("token"+index+"-decimal"), 
        amount: String(this.getAttribute("token"+index+"-amount")),
      };
    }

    this.signer = null;
    this.tx = null;

    this.modalConnect = false;
    this.modalPay = false;
    this.modalLoading = false;
    this.modalSuccess = false;
    this.modalFailed = false;
  }

  render() {
    return html`
      <main>
        <button @click="${()=>{this.modalConnect = true}}" class="${tw`border border-transparent hover:border-gray-300 bg-gray-300 dark:bg-white dark:hover:bg-gray-900 dark:hover:border-gray-900 dark:text-gray-900 dark:hover:text-white text-black flex flex-row justify-center items-center space-x-2 py-4 rounded w-full`}">
         ${this.label}
        </button>
        
        <!-- Connect Modal -->
        ${this.modalConnect ? 
          html`
            <div class="${tw`fixed z-10 overflow-y-auto top-0 w-full left-0 `}">
              <div class="${tw`flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0 `}">
                  <div class="${tw`fixed inset-0 transition-opacity`}">
                    <div class="${tw`absolute inset-0 bg-gray-900 opacity-75`}" />
                  </div>
                  <span class="${tw`hidden sm:inline-block sm:align-middle sm:h-screen`}">&#8203;</span>
                      <!-- Modal content -->
                      <div class="${tw`inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}">
                          <button @click=${()=> {this.modalConnect = false}} type="button" class="${tw`absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white`}">
                              <svg class="${tw`w-5 h-5`}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>  
                          </button>
                          <!-- Modal header -->
                          <div class="${tw`py-4 px-6 rounded-t border-b dark:border-gray-600`}">
                              <h3 class="${tw`text-base font-semibold text-gray-900 lg:text-xl dark:text-white`}">
                                  Connect wallet
                              </h3>
                          </div>
                          <!-- Modal body -->
                          <div class="${tw`p-6`}">
                              <p class="${tw`text-sm font-normal text-gray-500 dark:text-gray-400`}">Connect with one of our available wallet providers or create a new one.</p>
                              <ul class="${tw`my-4 space-y-3`}">
                                  <li>
                                      <a @click=${()=>{this._MetamaskConnect()}} class="${tw`flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white`}">
                                          <svg class="${tw`h-4`}" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.0728 0L21.9092 12.6999L25.1009 5.21543L39.0728 0Z" fill="#E17726"/><path d="M0.966797 0.0151367L14.9013 5.21656L17.932 12.7992L0.966797 0.0151367Z" fill="#E27625"/><path d="M32.1656 27.0093L39.7516 27.1537L37.1004 36.1603L27.8438 33.6116L32.1656 27.0093Z" fill="#E27625"/><path d="M7.83409 27.0093L12.1399 33.6116L2.89876 36.1604L0.263672 27.1537L7.83409 27.0093Z" fill="#E27625"/><path d="M17.5203 10.8677L17.8304 20.8807L8.55371 20.4587L11.1924 16.4778L11.2258 16.4394L17.5203 10.8677Z" fill="#E27625"/><path d="M22.3831 10.7559L28.7737 16.4397L28.8067 16.4778L31.4455 20.4586L22.1709 20.8806L22.3831 10.7559Z" fill="#E27625"/><path d="M12.4115 27.0381L17.4768 30.9848L11.5928 33.8257L12.4115 27.0381Z" fill="#E27625"/><path d="M27.5893 27.0376L28.391 33.8258L22.5234 30.9847L27.5893 27.0376Z" fill="#E27625"/><path d="M22.6523 30.6128L28.6066 33.4959L23.0679 36.1282L23.1255 34.3884L22.6523 30.6128Z" fill="#D5BFB2"/><path d="M17.3458 30.6143L16.8913 34.3601L16.9286 36.1263L11.377 33.4961L17.3458 30.6143Z" fill="#D5BFB2"/><path d="M15.6263 22.1875L17.1822 25.4575L11.8848 23.9057L15.6263 22.1875Z" fill="#233447"/><path d="M24.3739 22.1875L28.133 23.9053L22.8184 25.4567L24.3739 22.1875Z" fill="#233447"/><path d="M12.8169 27.0049L11.9606 34.0423L7.37109 27.1587L12.8169 27.0049Z" fill="#CC6228"/><path d="M27.1836 27.0049L32.6296 27.1587L28.0228 34.0425L27.1836 27.0049Z" fill="#CC6228"/><path d="M31.5799 20.0605L27.6165 24.0998L24.5608 22.7034L23.0978 25.779L22.1387 20.4901L31.5799 20.0605Z" fill="#CC6228"/><path d="M8.41797 20.0605L17.8608 20.4902L16.9017 25.779L15.4384 22.7038L12.3988 24.0999L8.41797 20.0605Z" fill="#CC6228"/><path d="M8.15039 19.2314L12.6345 23.7816L12.7899 28.2736L8.15039 19.2314Z" fill="#E27525"/><path d="M31.8538 19.2236L27.2061 28.2819L27.381 23.7819L31.8538 19.2236Z" fill="#E27525"/><path d="M17.6412 19.5088L17.8217 20.6447L18.2676 23.4745L17.9809 32.166L16.6254 25.1841L16.625 25.1119L17.6412 19.5088Z" fill="#E27525"/><path d="M22.3562 19.4932L23.3751 25.1119L23.3747 25.1841L22.0158 32.1835L21.962 30.4328L21.75 23.4231L22.3562 19.4932Z" fill="#E27525"/><path d="M27.7797 23.6011L27.628 27.5039L22.8977 31.1894L21.9414 30.5138L23.0133 24.9926L27.7797 23.6011Z" fill="#F5841F"/><path d="M12.2373 23.6011L16.9873 24.9926L18.0591 30.5137L17.1029 31.1893L12.3723 27.5035L12.2373 23.6011Z" fill="#F5841F"/><path d="M10.4717 32.6338L16.5236 35.5013L16.4979 34.2768L17.0043 33.8323H22.994L23.5187 34.2753L23.48 35.4989L29.4935 32.641L26.5673 35.0591L23.0289 37.4894H16.9558L13.4197 35.0492L10.4717 32.6338Z" fill="#C0AC9D"/><path d="M22.2191 30.231L23.0748 30.8354L23.5763 34.8361L22.8506 34.2234H17.1513L16.4395 34.8485L16.9244 30.8357L17.7804 30.231H22.2191Z" fill="#161616"/><path d="M37.9395 0.351562L39.9998 6.53242L38.7131 12.7819L39.6293 13.4887L38.3895 14.4346L39.3213 15.1542L38.0875 16.2779L38.8449 16.8264L36.8347 19.1742L28.5894 16.7735L28.5179 16.7352L22.5762 11.723L37.9395 0.351562Z" fill="#763E1A"/><path d="M2.06031 0.351562L17.4237 11.723L11.4819 16.7352L11.4105 16.7735L3.16512 19.1742L1.15488 16.8264L1.91176 16.2783L0.678517 15.1542L1.60852 14.4354L0.350209 13.4868L1.30098 12.7795L0 6.53265L2.06031 0.351562Z" fill="#763E1A"/><path d="M28.1861 16.2485L36.9226 18.7921L39.7609 27.5398L32.2728 27.5398L27.1133 27.6049L30.8655 20.2912L28.1861 16.2485Z" fill="#F5841F"/><path d="M11.8139 16.2485L9.13399 20.2912L12.8867 27.6049L7.72971 27.5398H0.254883L3.07728 18.7922L11.8139 16.2485Z" fill="#F5841F"/><path d="M25.5283 5.17383L23.0847 11.7736L22.5661 20.6894L22.3677 23.4839L22.352 30.6225H17.6471L17.6318 23.4973L17.4327 20.6869L16.9139 11.7736L14.4707 5.17383H25.5283Z" fill="#F5841F"/></svg>
                                          <span class="${tw`flex-1 ml-3 whitespace-nowrap`}">MetaMask</span>
                                          <span class="${tw`inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400`}">Popular</span>
                                      </a>
                                  </li>
                                  <li>
                                      <a @click=${()=>{this._WalletConnect()}} class="${tw`flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white`}">
                                          <svg class="${tw`h-5`}" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><radialGradient cx="0%" cy="50%" fx="0%" fy="50%" r="100%" id="radialGradient-1"><stop stop-color="#5D9DF6" offset="0%"></stop><stop stop-color="#006FFF" offset="100%"></stop></radialGradient></defs><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="logo"><rect id="base" fill="url(#radialGradient-1)" x="0" y="0" width="512" height="512" rx="256"></rect><path d="M169.209772,184.531136 C217.142772,137.600733 294.857519,137.600733 342.790517,184.531136 L348.559331,190.179285 C350.955981,192.525805 350.955981,196.330266 348.559331,198.676787 L328.82537,217.99798 C327.627045,219.171241 325.684176,219.171241 324.485851,217.99798 L316.547278,210.225455 C283.10802,177.485633 228.89227,177.485633 195.453011,210.225455 L186.951456,218.549188 C185.75313,219.722448 183.810261,219.722448 182.611937,218.549188 L162.877976,199.227995 C160.481326,196.881474 160.481326,193.077013 162.877976,190.730493 L169.209772,184.531136 Z M383.602212,224.489406 L401.165475,241.685365 C403.562113,244.031874 403.562127,247.836312 401.165506,250.182837 L321.971538,327.721548 C319.574905,330.068086 315.689168,330.068112 313.292501,327.721609 C313.292491,327.721599 313.29248,327.721588 313.29247,327.721578 L257.08541,272.690097 C256.486248,272.103467 255.514813,272.103467 254.915651,272.690097 C254.915647,272.690101 254.915644,272.690105 254.91564,272.690108 L198.709777,327.721548 C196.313151,330.068092 192.427413,330.068131 190.030739,327.721634 C190.030725,327.72162 190.03071,327.721606 190.030695,327.721591 L110.834524,250.181849 C108.437875,247.835329 108.437875,244.030868 110.834524,241.684348 L128.397819,224.488418 C130.794468,222.141898 134.680206,222.141898 137.076856,224.488418 L193.284734,279.520668 C193.883897,280.107298 194.85533,280.107298 195.454493,279.520668 C195.454502,279.520659 195.45451,279.520651 195.454519,279.520644 L251.65958,224.488418 C254.056175,222.141844 257.941913,222.141756 260.338618,224.488222 C260.338651,224.488255 260.338684,224.488288 260.338717,224.488321 L316.546521,279.520644 C317.145683,280.107273 318.117118,280.107273 318.71628,279.520644 L374.923175,224.489406 C377.319825,222.142885 381.205562,222.142885 383.602212,224.489406 Z" id="WalletConnect" fill="#FFFFFF" fill-rule="nonzero"></path></g></g></svg>
                                          <span class="${tw`flex-1 ml-3 whitespace-nowrap`}">WalletConnect</span>
                                      </a>
                                  </li>
                              </ul>
                              <div>
                                  <a href="#" class="${tw`inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400`}">
                                      <svg class="${tw`mr-2 w-3 h-3`}" aria-hidden="true" focusable="false" data-prefix="far" data-icon="question-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path></svg>
                                      Why do I need to connect with my wallet?</a>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `:""}
          <!-- Pay Modal -->
          ${this.modalPay ?
          html`
            <div class="${tw`fixed z-10 overflow-y-auto top-0 w-full left-0 `}">
              <div class="${tw`flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0 `}">
                <div class="${tw`fixed inset-0 transition-opacity`}">
                  <div class="${tw`absolute inset-0 bg-gray-900 opacity-75`}" />
                </div>
                <span class="${tw`hidden sm:inline-block sm:align-middle sm:h-screen`}">&#8203;</span>
                    <!-- Modal content -->
                    <div class="${tw`inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}">
                        <button @click=${()=> {this.modalPay = false}} type="button" class="${tw`absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white`}">
                            <svg class="${tw`w-5 h-5`}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>  
                        </button>
                        <!-- Modal header -->
                        <div class="${tw`py-4 px-6 rounded-t border-b dark:border-gray-600`}">
                            <h3 class="${tw`text-base font-semibold text-gray-900 lg:text-xl dark:text-white`}">
                                Pay With Crypto
                            </h3>
                        </div>
                        <!-- Modal body -->
                        <div class="${tw`p-6`}">
                            <ul class="${tw`my-4 space-y-3`}">
                                <li>
                                    <a @click=${this._payWithEth} class="${tw`flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white`}">
                                        <span class="${tw`flex-1 ml-3 whitespace-nowrap`}">ETH</span>
                                        <span class="${tw`inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400`}">0.01</span>
                                    </a>
                                </li>
                                  ${repeat(
                                    this.token,
                                    (token, index) => html`
                                      <li>
                                          <a  @click=${()=>{this._payWithToken(this.receiver, token.address, token.amount, token.decimal)}} class="${tw`flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white`}">
                                              <span class="${tw`flex-1 ml-3 whitespace-nowrap`}">  ${token.symbol} </span>
                                              <span class="${tw`inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400`}">${token.amount}</span>
                                          </a>
                                      </li>                                `
                                  )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
          `:""}

          <!-- Loading Modal -->
          ${this.modalLoading ?
            html`
              <div class="${tw`fixed z-10 overflow-y-auto top-0 w-full left-0 `}">
                <div class="${tw`flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0 `}">
                  <div class="${tw`fixed inset-0 transition-opacity`}">
                    <div class="${tw`absolute inset-0 bg-gray-900 opacity-75`}" />
                  </div>
                  <span class="${tw`hidden sm:inline-block sm:align-middle sm:h-screen`}">&#8203;</span>
                      <!-- Modal content -->
                      <div class="${tw`inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}">
                          <!-- Modal header -->
                          <div class="${tw`py-4 px-6 rounded-t border-b dark:border-gray-600`}">
                              <h3 class="${tw`text-base font-semibold text-gray-900 lg:text-xl dark:text-white`}">
                                Please wait your payment is being processed
                              </h3>
                          </div>
                          <!-- Modal body -->
                          <div class="${tw`p-6`}">
                            <div class="${tw`text-center`}">
                              <div class="load">
                                <div class="lds-dual-ring"></div>
                              </div>
                            </div>
                          </div>
                      </div>
                  </div>
              </div>
            `:""}
          
            <!-- Success Modal -->
            ${this.modalSuccess ? 
              html`
                <div class="${tw`fixed z-10 overflow-y-auto top-0 w-full left-0 `}">
                  <div class="${tw`flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0 `}">
                    <div class="${tw`fixed inset-0 transition-opacity`}">
                      <div class="${tw`absolute inset-0 bg-gray-900 opacity-75`}" />
                    </div>
                    <span class="${tw`hidden sm:inline-block sm:align-middle sm:h-screen`}">&#8203;</span>
                       
                        <!-- Modal content -->
                        <div class="${tw`inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}">
                            <button @click=${()=> {this.modalSuccess = false}} type="button" class="${tw`absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white`}">
                              <svg class="${tw`w-5 h-5`}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>  
                            </button>
                            <!-- Modal header -->
                            <div class="${tw`py-4 px-6 rounded-t border-b dark:border-gray-600`}">
                                <h3 class="${tw`text-base font-semibold text-gray-900 lg:text-xl dark:text-white`}">
                                  Your payment has been processed successfully 
                               </h3>
                            </div>
                            <!-- Modal body -->
                            <div class="${tw`p-6`}">
                              <div class="demo-1-web3">
                                <div class="ui-success">
                                  <svg viewBox="0 0 87 87" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                      <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                          <g id="Group-3" transform="translate(2.000000, 2.000000)">
                                            <circle id="Oval-2" stroke="rgba(165, 220, 134, 0.2)" stroke-width="4" cx="41.5" cy="41.5" r="41.5"></circle>
                                              <circle  class="ui-success-circle" id="Oval-2" stroke="#A5DC86" stroke-width="4" cx="41.5" cy="41.5" r="41.5"></circle>
                                              <polyline class="ui-success-path" id="Path-2" stroke="#A5DC86" stroke-width="4" points="19 38.8036813 31.1020744 54.8046875 63.299221 28"></polyline>
                                          </g>
                                      </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
              ` : ""}
            
            <!-- Failed Modal -->
            ${this.modalFailed ? 
              html`
                <div class="${tw`fixed z-10 overflow-y-auto top-0 w-full left-0 `}">
                  <div class="${tw`flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0 `}">
                    <div class="${tw`fixed inset-0 transition-opacity`}">
                      <div class="${tw`absolute inset-0 bg-gray-900 opacity-75`}" />
                    </div>
                    <span class="${tw`hidden sm:inline-block sm:align-middle sm:h-screen`}">&#8203;</span>
                        <!-- Modal content -->
                        <div class="${tw`inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}">
                            <button @click=${()=> {this.modalFailed = false}} type="button" class="${tw`absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white`}">
                              <svg class="${tw`w-5 h-5`}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>  
                            </button>
                            <!-- Modal header -->
                            <div class="${tw`py-4 px-6 rounded-t border-b dark:border-gray-600`}">
                                <h3 class="${tw`text-base font-semibold text-gray-900 lg:text-xl dark:text-white`}">
                                  Your payment has been cancelled
                                </h3>
                            </div>
                            <!-- Modal body -->
                            <div class="${tw`p-6`}">
                              <div class="demo-1-web3">
                                <div class="ui-error">
                                  <svg  viewBox="0 0 87 87" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <g id="Group-2" transform="translate(2.000000, 2.000000)">
                                          <circle id="Oval-2" stroke="rgba(252, 191, 191, .5)" stroke-width="4" cx="41.5" cy="41.5" r="41.5"></circle>
                                          <circle  class="ui-error-circle" stroke="#F74444" stroke-width="4" cx="41.5" cy="41.5" r="41.5"></circle>
                                            <path class="ui-error-line1" d="M22.244224,22 L60.4279902,60.1837662" id="Line" stroke="#F74444" stroke-width="3" stroke-linecap="square"></path>
                                            <path class="ui-error-line2" d="M60.755776,21 L23.244224,59.8443492" id="Line" stroke="#F74444" stroke-width="3" stroke-linecap="square"></path>
                                        </g>
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
              ` : ""}

      </main>
    `
  }
  
 // Metamask Connect 
  async _MetamaskConnect(){
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      this.signer = provider.getSigner();
      this.modalConnect = false;
      this.modalPay = true;
    } catch (error) {
        if (error.code) {
          console.log({signer:false, error:error.code});
        } else {
          console.log({signer:false, error: error});
      }
    }
  }

  // WalletConnect Connect
  async _WalletConnect(){
    const provider = new WalletConnectProvider({
      infuraId: "a20f1d0ef34d4f5c84a1d8cead42c105",
    });
    try {
        await provider.enable();
        const web3Provider = new providers.Web3Provider(provider);
        this.signer = web3Provider.getSigner();
        this.modalConnect = false;
        this.modalPay = true;
    } catch (error) {
        console.log({signer:false, error:error});
    }
  }


  // Pay with ETH
  async _payWithEth (){
    if(this.amount !== null && this.receiver !== null){
     this.modalPay = false;
     this.modalLoading = true;
      try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          let abi = ["function PayWithETH(address _to)external payable"]
          let contract = new ethers.Contract("0x82703A9F3618Dce7CE840f45704eD0160066A3B4", abi, signer);
          let overrides = {
              value: ethers.utils.parseUnits(this.amount,"ether"),
          };
          let tx = await contract.PayWithETH(this.receiver, overrides);
          let res = await tx.wait();
          if(res.status == 1){
            this.modalLoading = false;
            this.modalSuccess = true;
          }else{
            this.modalLoading = false;
            this.modalFailed = true;
          }
      } catch (error) {
          if(error.code === undefined){
            this.modalLoading = false;
            this.modalFailed = true;
          }else{
            this.modalLoading = false;
            this.modalFailed = true;
          }
      }
    }else{
      this.modalLoading = false;
      this.modalFailed = true;
    }
  }

  // Pay With Tokens
  async _payWithToken(_to, _token, amount, _decimal){
    if(amount !== undefined && _to !== undefined && _token !== undefined && _decimal!==undefined){
       this.modalPay = false;
       this.modalLoading = true;
        var _amount = "";
        if(_decimal == String(18)){
          _amount = ethers.utils.parseEther(amount);
        }else{
            _amount = String(parseInt(amount) * 10 ** parseInt(_decimal));
        }
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            let abi1 = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
            let contract_ERC20 = new ethers.Contract(_token.toString(), abi1, signer);
            let tx = await contract_ERC20.approve("0x82703A9F3618Dce7CE840f45704eD0160066A3B4", String(_amount));
            let res = await tx.wait();
            let overrides = {
                gasLimit: 750000,
            };
            let abi2 = ["function SwapTokenForETH(uint tokenAmount, address token, address to) external"];
            let contract = new ethers.Contract("0x82703A9F3618Dce7CE840f45704eD0160066A3B4",abi2,signer);
            tx = await contract.SwapTokenForETH(String(_amount),_token.toString(), _to.toString(), overrides);
            res = await tx.wait();
            if(res.status == 1){
              this.modalLoading = false;
              this.modalSuccess = true;
            }else{
              this.modalLoading = false;
              this.modalFailed = true;
            }
        } catch (error) {
            if(error.code === undefined){
              this.modalLoading = false;
              this.modalFailed = true;
            }else{
              this.modalLoading = false;
              this.modalFailed = true;
            }
        }
    }else{
      this.modalLoading = false;
      this.modalFailed = true;
    }

  }  
}


customElements.define('web3-element', Web3Element);