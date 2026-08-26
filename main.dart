import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  runApp(const CyberPOSApp());
}

class CyberPOSApp extends StatelessWidget {
  const CyberPOSApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Neon Cyber POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        primaryColor: const Color(0xFF00FFC4),
        fontFamily: 'Courier', // Tech aesthetic font fallback
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00FFC4),
          secondary: Color(0xFF7C3AED),
          surface: Color(0xFF161F30),
          background: const Color(0xFF0B0F19),
        ),
      ),
      home: const CyberPOSDashboard(),
    );
  }
}

// Model Class for POS Product
class Product {
  final String id;
  final String name;
  final double price;
  final String icon;
  final String category;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.icon,
    required this.category,
  });
}

// Static Catalog
const List<Product> kProducts = [
  Product(id: '1', name: 'Kopi Aren Lero', price: 18000, icon: '☕', category: 'Drink'),
  Product(id: '2', name: 'Mie Goreng Special', price: 15000, icon: '🍜', category: 'Food'),
  Product(id: '3', name: 'Es Pisang Ijo Khas', price: 16000, icon: '🍌', category: 'Dessert'),
  Product(id: '4', name: 'Ayam Sambal Korek', price: 22000, icon: '🍗', category: 'Food'),
  Product(id: '5', name: 'Kerupuk Bakwan', price: 10000, icon: '🍘', category: 'Snack'),
  Product(id: '6', name: 'Roti Bakar Cokelat', price: 14000, icon: '🍞', category: 'Dessert'),
  Product(id: '7', name: 'Teh Manis Krisan', price: 8000, icon: '🍵', category: 'Drink'),
  Product(id: '8', name: 'Dimsum Rambutan', price: 15000, icon: '🥟', category: 'Snack'),
];

// POS Controller (State Container utilizing ValueNotifiers for modular architecture without naked setState)
class POSController {
  final ValueNotifier<Map<Product, int>> cartNotifier = ValueNotifier<Map<Product, int>>({});
  final ValueNotifier<double> cashReceivedNotifier = ValueNotifier<double>(0.0);
  final ValueNotifier<bool> isPaymentSuccess = ValueNotifier<bool>(false);

  double get totalBelanja {
    double total = 0.0;
    cartNotifier.value.forEach((product, qty) {
      total += product.price * qty;
    });
    return total;
  }

  double get kembalian {
    final double cash = cashReceivedNotifier.value;
    final double total = totalBelanja;
    if (cash >= total) {
      return cash - total;
    }
    return 0.0;
  }

  bool get canCheckout {
    final double cash = cashReceivedNotifier.value;
    final double total = totalBelanja;
    return total > 0 && cash >= total;
  }

  void addProduct(Product product) {
    final currentMap = Map<Product, int>.from(cartNotifier.value);
    if (currentMap.containsKey(product)) {
      currentMap[product] = currentMap[product]! + 1;
    } else {
      currentMap[product] = 1;
    }
    cartNotifier.value = currentMap;
  }

  void removeProduct(Product product) {
    final currentMap = Map<Product, int>.from(cartNotifier.value);
    if (currentMap.containsKey(product)) {
      if (currentMap[product] == 1) {
        currentMap.remove(product);
      } else {
        currentMap[product] = currentMap[product]! - 1;
      }
      cartNotifier.value = currentMap;
    }
  }

  void clearCart() {
    cartNotifier.value = {};
    cashReceivedNotifier.value = 0.0;
  }

  void processTransaction() {
    if (canCheckout) {
      isPaymentSuccess.value = true;
    }
  }

  void resetTransaction() {
    isPaymentSuccess.value = false;
    clearCart();
  }

  void dispose() {
    cartNotifier.dispose();
    cashReceivedNotifier.dispose();
    isPaymentSuccess.dispose();
  }
}

// Main Interactive Dashboard Screen
class CyberPOSDashboard extends StatefulWidget {
  const CyberPOSDashboard({Key? key}) : super(key: key);

  @override
  State<CyberPOSDashboard> createState() => _CyberPOSDashboardState();
}

class _CyberPOSDashboardState extends State<CyberPOSDashboard> {
  late final POSController _controller;
  final TextEditingController _cashInputController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controller = POSController();
    _cashInputController.addListener(_onCashChanged);
  }

  void _onCashChanged() {
    final cleaned = _cashInputController.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (cleaned.isEmpty) {
      _controller.cashReceivedNotifier.value = 0.0;
    } else {
      final parsed = double.tryParse(cleaned);
      if (parsed != null) {
        _controller.cashReceivedNotifier.value = parsed;
      }
    }
  }

  @override
  void dispose() {
    _cashInputController.removeListener(_onCashChanged);
    _cashInputController.dispose();
    _controller.dispose();
    super.dispose();
  }

  // Indonesian Rupiah Formatter Util
  static String formatRupiah(double value) {
    final int val = value.round();
    final String str = val.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count == 3 && i != 0) {
        buffer.write('.');
        count = 0;
      }
    }
    return 'Rp ' + buffer.toString().split('').reversed.join('');
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 900;

    return Scaffold(
      body: Stack(
        children: [
          // Cyber Ambient Background
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF7C3AED).withOpacity(0.15),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            right: -50,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF00FFC4).withOpacity(0.10),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 90, sigmaY: 90),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Premium Cyber Header
                _buildHeader(),

                Expanded(
                  child: isDesktop
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(flex: 3, child: _buildProductGrid()),
                            Expanded(flex: 2, child: _buildBillingSidebar()),
                          ],
                        )
                      : Column(
                          children: [
                            Expanded(child: _buildProductGrid()),
                            _buildBillingCompactPanel(),
                          ],
                        ),
                ),
              ],
            ),
          ),

          // Transaction Checkout Success Sheet Modal
          ValueListenableBuilder<bool>(
            valueListenable: _controller.isPaymentSuccess,
            builder: (context, isSuccess, _) {
              if (!isSuccess) return const SizedBox.shrink();
              return _buildCheckoutResultOverlay();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: const Color(0xFF00FFC4).withOpacity(0.15),
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8.0),
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF7C3AED).withOpacity(0.5)),
                ),
                child: const Icon(Icons.bolt, color: Color(0xFF00FFC4), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'WARUNG LERO POS',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.extrabold,
                      letterSpacing: 2,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Color(0xFF00FFC4),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'ONLINE STABLE',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF00FFC4).withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          IconButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              _controller.clearCart();
              _cashInputController.clear();
            },
            icon: const Icon(Icons.refresh, color: Colors.white60),
            tooltip: 'Reset Cashier Cart',
          ),
        ],
      ),
    );
  }

  Widget _buildProductGrid() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'CATALOG KULINER',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.black,
                    letterSpacing: 2,
                    color: Colors.white38,
                  ),
                ),
                ValueListenableBuilder<Map<Product, int>>(
                  valueListenable: _controller.cartNotifier,
                  builder: (context, cart, _) {
                    final totalItems = cart.values.fold<int>(0, (p, c) => p + c);
                    return Text(
                      '$totalItems ITEMS SELECTED',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00FFC4),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: GridView.builder(
              physics: const BouncingScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 220,
                childAspectRatio: 0.85,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: kProducts.length,
              itemBuilder: (context, index) {
                final product = kProducts[index];
                return ValueListenableBuilder<Map<Product, int>>(
                  valueListenable: _controller.cartNotifier,
                  builder: (context, cart, _) {
                    final qty = cart[product] ?? 0;
                    return CyberGroupCard(
                      product: product,
                      quantity: qty,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _controller.addProduct(product);
                      },
                      onAdd: () {
                        HapticFeedback.lightImpact();
                        _controller.addProduct(product);
                      },
                      onRemove: () {
                        HapticFeedback.lightImpact();
                        _controller.removeProduct(product);
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillingSidebar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: const Color(0xFF00FFC4).withOpacity(0.15),
          ),
        ),
      ),
      child: Column(
        children: [
          const Expanded(child: CartListViewWidget()),
          _buildInternalCalculationsPanel(isSidebar: true),
        ],
      ),
    );
  }

  Widget _buildBillingCompactPanel() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 120,
          child: const CartListViewWidget(),
        ),
        _buildInternalCalculationsPanel(isSidebar: false),
      ],
    );
  }

  // Integrated Glassmorphism Panel
  Widget _buildInternalCalculationsPanel({required bool isSidebar}) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24.0),
          decoration: BoxDecoration(
            color: const Color(0xFF161F30).withOpacity(0.70),
            border: Border(
              top: BorderSide(
                color: const Color(0xFF00FFC4).withOpacity(0.20),
                width: 1.5,
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 1. Total Belanja Formatter in Scrolling/Tween Animated Fashion
              ValueListenableBuilder<Map<Product, int>>(
                valueListenable: _controller.cartNotifier,
                builder: (context, _, __) {
                  final total = _controller.totalBelanja;
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'TOTAL TAGIHAN',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                          color: Colors.white54,
                        ),
                      ),
                      TweenAnimationBuilder<double>(
                        tween: Tween<double>(begin: 0.0, end: total),
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeOutCubic,
                        builder: (context, animatedValue, child) {
                          return Text(
                            formatRupiah(animatedValue),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.black,
                              color: Color(0xFF00FFC4),
                              shadows: [
                                Shadow(
                                  color: Color(0xFF00FFC4),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 16),

              // 2. Cyberpunk Text Field
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B0F19),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: const Color(0xFF7C3AED).withOpacity(0.4),
                          width: 1,
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          const Text(
                            'BAYAR',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.black,
                              color: Color(0xFF7C3AED),
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: _cashInputController,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              cursorColor: const Color(0xFF00FFC4),
                              decoration: const InputDecoration(
                                hintText: 'Ketik Nominal Cash...',
                                hintStyle: TextStyle(
                                  color: Colors.white24,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 3. Kembalian Formatter in Scrolling Animated Format
              ValueListenableBuilder<double>(
                valueListenable: _controller.cashReceivedNotifier,
                builder: (context, _, __) {
                  return ValueListenableBuilder<Map<Product, int>>(
                    valueListenable: _controller.cartNotifier,
                    builder: (context, _, __) {
                      final change = _controller.kembalian;
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'KEMBALIAN CASH',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              color: Colors.white54,
                            ),
                          ),
                          TweenAnimationBuilder<double>(
                            tween: Tween<double>(begin: 0.0, end: change),
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOutCubic,
                            builder: (context, animatedValue, child) {
                              return Text(
                                formatRupiah(animatedValue),
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.black,
                                  color: animatedValue > 0
                                      ? const Color(0xFF00FFC4)
                                      : Colors.white60,
                                ),
                              );
                            },
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
              const SizedBox(height: 20),

              // 4. Glow-Pulsed Locked Pay Button (Transactional Logic Guard)
              ValueListenableBuilder<double>(
                valueListenable: _controller.cashReceivedNotifier,
                builder: (context, cash, _) {
                  return ValueListenableBuilder<Map<Product, int>>(
                    valueListenable: _controller.cartNotifier,
                    builder: (context, cart, _) {
                      final isActive = _controller.canCheckout;
                      return ConstrainedBox(
                        constraints: const BoxConstraints(minHeight: 54),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: isActive
                                ? [
                                    BoxShadow(
                                      color: const Color(0xFF00FFC4).withOpacity(0.35),
                                      blurRadius: 15,
                                      offset: const Offset(0, 4),
                                    )
                                  ]
                                : [],
                          ),
                          child: InkWell(
                            onTap: isActive
                                ? () {
                                    HapticFeedback.heavyImpact();
                                    _controller.processTransaction();
                                  }
                                : null,
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: isActive
                                    ? const LinearGradient(
                                        colors: [Color(0xFF00FFC4), Color(0xFF7C3AED)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      )
                                    : BoxDecoration.solidColor(Colors.grey[800]!),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    isActive ? Icons.vpn_key : Icons.lock,
                                    color: isActive ? const Color(0xFF0B0F19) : Colors.white24,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    isActive ? 'BAYAR SEKARANG' : 'NOMINAL INSUFFICIENT',
                                    style: TextStyle(
                                      color: isActive ? const Color(0xFF0B0F19) : Colors.white24,
                                      fontSize: 12,
                                      fontWeight: FontWeight.extrabold,
                                      letterSpacing: 2.0,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCheckoutResultOverlay() {
    final double total = _controller.totalBelanja;
    final double cash = _controller.cashReceivedNotifier.value;
    final double change = _controller.kembalian;

    return Positioned.fill(
      child: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            color: const Color(0xFF0B0F19).withOpacity(0.85),
            alignment: Alignment.center,
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: ScaleBounceWidget(
                child: Container(
                  width: double.infinity,
                  maxW: 420,
                  decoration: BoxDecoration(
                    color: const Color(0xFF161F30),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: const Color(0xFF00FFC4).withOpacity(0.4),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00FFC4).withOpacity(0.05),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(28),
                            topRight: Radius.circular(28),
                          ),
                          border: Border(
                            bottom: BorderSide(
                              color: const Color(0xFF00FFC4).withOpacity(0.1),
                            ),
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFF00FFC4),
                              ),
                              child: const Icon(
                                Icons.check_circle_outline,
                                color: Color(0xFF0B0F19),
                                size: 36,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'TRANSAKSI SUKSES ⚡',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.black,
                                letterSpacing: 2,
                                color: Color(0xFF00FFC4),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Details
                      Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'RINCIAN STRUK',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.white38,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ..._controller.cartNotifier.value.entries.map((entry) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${entry.key.name}  x${entry.value}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      formatRupiah(entry.key.price * entry.value),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.white70,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                            const Divider(color: Colors.white12, height: 24),
                            _buildReceiptRow('TOTAL BELANJA', formatRupiah(total), isPrimary: true),
                            const SizedBox(height: 8),
                            _buildReceiptRow('TUNAI DITERIMA', formatRupiah(cash)),
                            const SizedBox(height: 8),
                            _buildReceiptRow('UANG KEMBALIAN', formatRupiah(change), isAccent: true),
                          ],
                        ),
                      ),

                      // Actions Button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              HapticFeedback.mediumImpact();
                              _cashInputController.clear();
                              _controller.resetTransaction();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00FFC4),
                              foregroundColor: const Color(0xFF0B0F19),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text(
                              'BUAT TRANSAKSI BARU',
                              style: TextStyle(
                                fontWeight: FontWeight.black,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String title, String value, {bool isPrimary = false, bool isAccent = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: isPrimary ? 12 : 11,
            fontWeight: isPrimary ? FontWeight.black : FontWeight.bold,
            color: isPrimary ? Colors.white : Colors.white60,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isPrimary ? 16 : 13,
            fontWeight: FontWeight.black,
            color: isPrimary
                ? Colors.white
                : (isAccent ? const Color(0xFF00FFC4) : Colors.white70),
          ),
        ),
      ],
    );
  }
}

// Widget displaying detailed Cart line items
class CartListViewWidget extends StatelessWidget {
  const CartListViewWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dashboard = context.findAncestorStateOfType<_CyberPOSDashboardState>();
    if (dashboard == null) return const SizedBox.shrink();

    return ValueListenableBuilder<Map<Product, int>>(
      valueListenable: dashboard._controller.cartNotifier,
      builder: (context, cart, _) {
        if (cart.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shopping_cart_outlined, size: 28, color: Colors.white24),
                SizedBox(height: 12),
                Text(
                  'Keranjang Kosong',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white24,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: cart.length,
          itemBuilder: (context, index) {
            final entry = cart.entries.elementAt(index);
            final product = entry.key;
            final qty = entry.value;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF161F30),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF00FFC4).withOpacity(0.08),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B0F19),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF7C3AED).withOpacity(0.2),
                      ),
                    ),
                    child: Text(product.icon, style: const TextStyle(fontSize: 18)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _CyberPOSDashboardState.formatRupiah(product.price),
                          style: TextStyle(
                            fontSize: 10,
                            color: const Color(0xFF00FFC4).withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          dashboard._controller.removeProduct(product);
                        },
                        icon: const Icon(Icons.remove, size: 14, color: Colors.white60),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$qty',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.black,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          dashboard._controller.addProduct(product);
                        },
                        icon: const Icon(Icons.add, size: 14, color: Color(0xFF00FFC4)),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

// Wrapper extension to avoid full class declarations
extension on BoxDecoration {
  static BoxDecoration solidColor(Color color) {
    return BoxDecoration(
      color: color,
    );
  }
}

// Custom UI Wrapper enabling exact box maximum layouts
class CyberGroupCard extends StatelessWidget {
  final Product product;
  final int quantity;
  final VoidCallback onTap;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  const CyberGroupCard({
    Key? key,
    required this.product,
    required this.quantity,
    required this.onTap,
    required this.onAdd,
    required this.onRemove,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isSelected = quantity > 0;

    return ScaleBounceWidget(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: const Color(0xFF161F30),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF00FFC4).withOpacity(0.50)
                : const Color(0xFF7C3AED).withOpacity(0.12),
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF00FFC4).withOpacity(0.08),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  )
                ]
              : [],
        ),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Align(
              alignment: Alignment.topLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B0F19),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  product.category.toUpperCase(),
                  style: const TextStyle(size: 8, fontWeight: FontWeight.bold, color: Colors.white24),
                ),
              ),
            ),
            const Spacer(),
            Text(
              product.icon,
              style: const TextStyle(fontSize: 38),
            ),
            const SizedBox(height: 12),
            Text(
              product.name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              _CyberPOSDashboardState.formatRupiah(product.price),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.black,
                color: Color(0xFF00FFC4),
              ),
            ),
            const Spacer(),
            const Divider(color: Colors.white12, height: 16),
            isSelected
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: onRemove,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0B0F19),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white12),
                          ),
                          child: const Icon(Icons.remove, size: 12, color: Colors.white70),
                        ),
                      ),
                      Text(
                        '$quantity',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.black,
                          color: Colors.white,
                        ),
                      ),
                      GestureDetector(
                        onTap: onAdd,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Color(0xFF00FFC4),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add, size: 12, color: Color(0xFF0B0F19)),
                        ),
                      ),
                    ],
                  )
                : Container(
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C3AED).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF7C3AED).withOpacity(0.2)),
                    ),
                    child: const Text(
                      'PILIH +',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.black,
                        color: Color(0xFF00FFC4),
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

// Custom scale animation wrapper on click (High-End bounce experience)
class ScaleBounceWidget extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double maxW;

  const ScaleBounceWidget({
    Key? key,
    required this.child,
    this.onTap,
    this.maxW = double.infinity,
  }) : super(key: key);

  @override
  _ScaleBounceWidgetState createState() => _ScaleBounceWidgetState();
}

class _ScaleBounceWidgetState extends State<ScaleBounceWidget> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 70),
      reverseDuration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.94).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.onTap != null) {
      _controller.forward();
    }
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.onTap != null) {
      _controller.reverse();
      widget.onTap!();
    }
  }

  void _onTapCancel() {
    if (widget.onTap != null) {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget res = ScaleTransition(
      scale: _scaleAnimation,
      child: widget.child,
    );

    if (widget.maxW != double.infinity) {
      res = Container(
        constraints: BoxConstraints(maxWidth: widget.maxW),
        child: res,
      );
    }

    if (widget.onTap != null) {
      return GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        child: res,
      );
    }

    return res;
  }
}
