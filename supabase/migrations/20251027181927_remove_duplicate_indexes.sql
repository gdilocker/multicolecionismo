/*
  # Remove Duplicate Indexes
  
  1. Changes
    - Remove duplicate index idx_commissions_order
    - Keep idx_affiliate_commissions_order as primary
  
  2. Performance Improvements
    - Reduces storage usage
    - Reduces index maintenance overhead
    - Keeps only necessary indexes
*/

-- Remove the duplicate index
DROP INDEX IF EXISTS idx_commissions_order;

-- The idx_affiliate_commissions_order index remains and serves the same purpose
