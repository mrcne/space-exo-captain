from __future__ import annotations
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def build_mlp(input_dim: int, n_classes: int) -> keras.Model:
    inputs = keras.Input(shape=(input_dim,), name="features")
    x = layers.Dense(256, activation="relu")(inputs)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(n_classes, activation="softmax")(x)
    model = keras.Model(inputs, outputs, name="mlp_tabular")
    # compiled later in trainer
    return model

def build_mlp_bn(input_dim: int, n_classes: int) -> keras.Model:
    """Stronger MLP: Dense -> BN -> Dropout (twice)"""
    inputs = keras.Input(shape=(input_dim,), name="features")
    x = layers.Dense(512, activation="relu")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(n_classes, activation="softmax")(x)
    return keras.Model(inputs, outputs, name="mlp_bn_tabular")

def build_cnn1d(seq_len: int, n_classes: int) -> keras.Model:
    inputs = keras.Input(shape=(seq_len, 1), name="feat_seq")
    x = layers.Conv1D(64, kernel_size=5, padding="same", activation="relu")(inputs)
    x = layers.MaxPooling1D(pool_size=2)(x)
    x = layers.Conv1D(128, kernel_size=3, padding="same", activation="relu")(x)
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(n_classes, activation="softmax")(x)
    return keras.Model(inputs, outputs, name="cnn1d_tabular")

class TransformerBlock(layers.Layer):
    def __init__(self, d_model: int, num_heads: int, mlp_ratio: float = 2.0, dropout: float = 0.1):
        super().__init__()
        self.attn = layers.MultiHeadAttention(num_heads=num_heads, key_dim=d_model)
        self.drop1 = layers.Dropout(dropout)
        self.norm1 = layers.LayerNormalization(epsilon=1e-6)
        self.mlp = keras.Sequential([
            layers.Dense(int(d_model * mlp_ratio), activation="relu"),
            layers.Dense(d_model),
        ])
        self.drop2 = layers.Dropout(dropout)
        self.norm2 = layers.LayerNormalization(epsilon=1e-6)

    def call(self, x, training=False):
        h = self.attn(x, x, training=training)
        h = self.drop1(h, training=training)
        x = self.norm1(x + h)
        h2 = self.mlp(x, training=training)
        h2 = self.drop2(h2, training=training)
        return self.norm2(x + h2)

def build_feature_transformer(seq_len: int, n_classes: int, d_model: int = 128, depth: int = 4, heads: int = 8, dropout: float = 0.1) -> keras.Model:
    inputs = keras.Input(shape=(seq_len,), name="features")
    x = layers.Reshape((seq_len, 1))(inputs)
    x = layers.Dense(d_model, use_bias=False, name="token_projection")(x)
    positions = tf.range(start=0, limit=seq_len, delta=1)
    pos_emb = layers.Embedding(input_dim=seq_len, output_dim=d_model, name="pos_embedding")(positions)
    pos_emb = tf.expand_dims(pos_emb, axis=0)
    x = x + pos_emb
    for _ in range(depth):
        x = TransformerBlock(d_model, heads, mlp_ratio=2.0, dropout=dropout)(x)
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(n_classes, activation="softmax")(x)
    return keras.Model(inputs, outputs, name="ft_transformer_light")
