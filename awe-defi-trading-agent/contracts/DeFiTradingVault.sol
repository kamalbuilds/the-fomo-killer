// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params) external returns (uint256 amountOut);
}

interface IAeroDromeRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract DeFiTradingVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Base network addresses
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // USDC on Base
    address public constant WETH = 0x4200000000000000000000000000000000000006; // WETH on Base
    address public constant UNISWAP_V3_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481; // Base Uniswap V3
    address public constant AERODROME_ROUTER = 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43; // Aerodrome on Base
    
    struct Position {
        address token;
        uint256 amount;
        uint256 entryPrice;
        uint256 stopLoss;
        uint256 takeProfit;
        uint256 openedAt;
        bool isActive;
    }
    
    struct UserAccount {
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 totalPnL;
        mapping(uint256 => Position) positions;
        uint256 positionCount;
        bool isAuthorized;
    }
    
    mapping(address => UserAccount) public userAccounts;
    mapping(address => bool) public authorizedAgents;
    
    uint256 public constant MAX_POSITIONS = 10;
    uint256 public constant MIN_DEPOSIT = 10 * 10**6; // 10 USDC
    uint256 public performanceFee = 1000; // 10%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event PositionOpened(address indexed user, uint256 positionId, address token, uint256 amount);
    event PositionClosed(address indexed user, uint256 positionId, uint256 pnl);
    event AgentAuthorized(address indexed user, address indexed agent);
    event AgentRevoked(address indexed user, address indexed agent);
    
    modifier onlyAuthorizedAgent(address user) {
        require(
            msg.sender == user || authorizedAgents[msg.sender],
            "Not authorized"
        );
        require(userAccounts[user].isAuthorized, "User not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    function deposit(uint256 amount) external nonReentrant {
        require(amount >= MIN_DEPOSIT, "Below minimum deposit");
        
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);
        
        userAccounts[msg.sender].balance += amount;
        userAccounts[msg.sender].totalDeposited += amount;
        userAccounts[msg.sender].isAuthorized = true;
        
        emit Deposit(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        UserAccount storage account = userAccounts[msg.sender];
        require(account.balance >= amount, "Insufficient balance");
        
        // Close all positions before withdrawal
        for (uint256 i = 0; i < account.positionCount; i++) {
            if (account.positions[i].isActive) {
                _closePosition(msg.sender, i);
            }
        }
        
        account.balance -= amount;
        account.totalWithdrawn += amount;
        
        // Deduct performance fee if in profit
        if (account.totalPnL > 0) {
            uint256 fee = (account.totalPnL * performanceFee) / FEE_DENOMINATOR;
            if (fee < amount) {
                amount -= fee;
                IERC20(USDC).safeTransfer(owner(), fee);
            }
        }
        
        IERC20(USDC).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount);
    }
    
    function authorizeAgent(address agent) external {
        authorizedAgents[agent] = true;
        userAccounts[msg.sender].isAuthorized = true;
        emit AgentAuthorized(msg.sender, agent);
    }
    
    function revokeAgent(address agent) external {
        authorizedAgents[agent] = false;
        emit AgentRevoked(msg.sender, agent);
    }
    
    function openPosition(
        address user,
        address token,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 stopLoss,
        uint256 takeProfit
    ) external onlyAuthorizedAgent(user) whenNotPaused returns (uint256 positionId) {
        UserAccount storage account = userAccounts[user];
        require(account.balance >= amountIn, "Insufficient balance");
        require(account.positionCount < MAX_POSITIONS, "Max positions reached");
        
        // Execute swap through Uniswap V3
        uint256 amountOut = _swapUniswapV3(USDC, token, amountIn, minAmountOut);
        
        positionId = account.positionCount++;
        account.positions[positionId] = Position({
            token: token,
            amount: amountOut,
            entryPrice: (amountIn * 1e18) / amountOut, // Simplified price calculation
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            openedAt: block.timestamp,
            isActive: true
        });
        
        account.balance -= amountIn;
        
        emit PositionOpened(user, positionId, token, amountOut);
    }
    
    function closePosition(
        address user,
        uint256 positionId
    ) external onlyAuthorizedAgent(user) whenNotPaused {
        _closePosition(user, positionId);
    }
    
    function _closePosition(address user, uint256 positionId) internal {
        UserAccount storage account = userAccounts[user];
        Position storage position = account.positions[positionId];
        require(position.isActive, "Position not active");
        
        // Swap back to USDC
        uint256 amountOut = _swapUniswapV3(
            position.token,
            USDC,
            position.amount,
            0 // Accept any amount for closing
        );
        
        // Calculate PnL
        uint256 entryValue = (position.amount * position.entryPrice) / 1e18;
        int256 pnl = int256(amountOut) - int256(entryValue);
        
        account.balance += amountOut;
        account.totalPnL = uint256(int256(account.totalPnL) + pnl);
        position.isActive = false;
        
        emit PositionClosed(user, positionId, uint256(pnl));
    }
    
    function _swapUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256) {
        IERC20(tokenIn).safeApprove(UNISWAP_V3_ROUTER, amountIn);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 3000, // 0.3% fee tier
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        return ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(params);
    }
    
    function _swapAerodrome(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256) {
        IERC20(tokenIn).safeApprove(AERODROME_ROUTER, amountIn);
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = IAeroDromeRouter(AERODROME_ROUTER).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[amounts.length - 1];
    }
    
    function getUserAccount(address user) external view returns (
        uint256 balance,
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        uint256 totalPnL,
        uint256 activePositions
    ) {
        UserAccount storage account = userAccounts[user];
        uint256 active = 0;
        
        for (uint256 i = 0; i < account.positionCount; i++) {
            if (account.positions[i].isActive) {
                active++;
            }
        }
        
        return (
            account.balance,
            account.totalDeposited,
            account.totalWithdrawn,
            account.totalPnL,
            active
        );
    }
    
    function getPosition(address user, uint256 positionId) external view returns (Position memory) {
        return userAccounts[user].positions[positionId];
    }
    
    function setPerformanceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 2000, "Fee too high"); // Max 20%
        performanceFee = _fee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}