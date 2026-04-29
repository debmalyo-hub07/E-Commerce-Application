import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 20 },
  text: { fontSize: 12, marginBottom: 5 },
  boldText: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1 solid #eee', paddingBottom: 5, marginBottom: 5, marginTop: 5 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
});

export const PDFReceipt = ({ order }: { order: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Invoice</Text>
      
      <View style={styles.section}>
        <View style={styles.row}>
          <View>
            <Text style={styles.boldText}>Order Number:</Text>
            <Text style={styles.text}>{order.orderNumber}</Text>
          </View>
          <View>
            <Text style={styles.boldText}>Date:</Text>
            <Text style={styles.text}>{new Date(order.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.boldText}>Billed To:</Text>
        <Text style={styles.text}>{order.addressSnapshot?.fullName}</Text>
        <Text style={styles.text}>{order.addressSnapshot?.addressLine1}</Text>
        {order.addressSnapshot?.addressLine2 && <Text style={styles.text}>{order.addressSnapshot?.addressLine2}</Text>}
        <Text style={styles.text}>{order.addressSnapshot?.city}, {order.addressSnapshot?.state} {order.addressSnapshot?.pincode}</Text>
        <Text style={styles.text}>Ph: {order.addressSnapshot?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.boldText}>Order Items</Text>
        {order.items.map((item: any, i: number) => (
          <View key={i} style={styles.row}>
            <View style={{ width: '70%' }}>
              <Text style={styles.text}>{item.productSnapshot?.name}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Qty: {item.quantity} x Rs. {item.unitPrice.toFixed(2)}</Text>
            </View>
            <View style={{ width: '30%', alignItems: 'flex-end' }}>
              <Text style={styles.text}>Rs. {item.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.totalsRow}>
          <Text style={styles.text}>Subtotal:</Text>
          <Text style={styles.text}>Rs. {order.subtotal.toFixed(2)}</Text>
        </View>
        {order.discountAmount > 0 && (
          <View style={styles.totalsRow}>
            <Text style={styles.text}>Discount:</Text>
            <Text style={styles.text}>-Rs. {order.discountAmount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.totalsRow}>
          <Text style={styles.text}>GST (Included):</Text>
          <Text style={styles.text}>Rs. {order.gstAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.text}>Shipping:</Text>
          <Text style={styles.text}>Rs. {order.shippingAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalsRow, { marginTop: 15, borderTop: '1 solid #000', paddingTop: 10 }]}>
          <Text style={styles.boldText}>Total Paid:</Text>
          <Text style={styles.boldText}>Rs. {order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 30 }}>
          Thank you for shopping with NexMart!
        </Text>
      </View>
    </Page>
  </Document>
);

export default PDFReceipt;